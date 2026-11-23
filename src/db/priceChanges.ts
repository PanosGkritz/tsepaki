import type { SQLiteDatabase } from 'expo-sqlite';
import { getPlanPrice, type ServicePlan } from '../data/services';
import { toIsoDate } from '../lib/dates';
import type { BillingCycle } from '../types/subscription';

// Ιστορικό τιμών (Pro). Δύο πηγές:
// - manual: ο χρήστης άλλαξε την τιμή στη φόρμα (καταγράφεται ως «applied»)
// - catalog: ανέβηκε η τιμή στον κατάλογο. Μένει «pending» μέχρι να απαντήσει ο χρήστης
//   «Το κρατάς;», γιατί τις συνδρομές του δεν τις αλλάζουμε ποτέ μόνοι μας.
export type PriceChangeSource = 'manual' | 'catalog';
export type PriceChangeStatus = 'applied' | 'pending' | 'dismissed';

export type PriceChange = {
  id: number;
  subscriptionId: string;
  changedOn: string;
  oldPrice: number;
  newPrice: number;
  source: PriceChangeSource;
  status: PriceChangeStatus;
};

type PriceChangeRow = {
  id: number;
  subscription_id: string;
  changed_on: string;
  old_cents: number;
  new_cents: number;
  source: string;
  status: string;
};

const toPriceChange = (row: PriceChangeRow): PriceChange => ({
  id: row.id,
  subscriptionId: row.subscription_id,
  changedOn: row.changed_on,
  oldPrice: row.old_cents / 100,
  newPrice: row.new_cents / 100,
  source: row.source === 'catalog' ? 'catalog' : 'manual',
  status: row.status === 'pending' || row.status === 'dismissed' ? row.status : 'applied',
});

const toCents = (amount: number) => Math.round(amount * 100);

export const percentChange = (oldPrice: number, newPrice: number) =>
  oldPrice > 0 ? Math.round(((newPrice - oldPrice) / oldPrice) * 100) : 0;

export const recordManualPriceChange = async (
  db: SQLiteDatabase,
  subscriptionId: string,
  oldPrice: number,
  newPrice: number,
  today = new Date(),
) => {
  const oldCents = toCents(oldPrice);
  const newCents = toCents(newPrice);
  if (oldCents === newCents) return;

  await db.runAsync(
    `INSERT INTO price_changes (subscription_id, changed_on, old_cents, new_cents, source, status)
     VALUES (?, ?, ?, ?, 'manual', 'applied')`,
    subscriptionId,
    toIsoDate(today),
    oldCents,
    newCents,
  );

  // Αν περίμενε ερώτηση για αύξηση από τον κατάλογο, ο χρήστης μόλις απάντησε μόνος του.
  await db.runAsync(
    `UPDATE price_changes SET status = 'dismissed'
     WHERE subscription_id = ? AND status = 'pending'`,
    subscriptionId,
  );
};

// Οι αλλαγές που έγιναν πραγματικά, από την παλιότερη στη νεότερη.
export const getPriceHistory = async (db: SQLiteDatabase, subscriptionId: string) => {
  const rows = await db.getAllAsync<PriceChangeRow>(
    `SELECT * FROM price_changes
     WHERE subscription_id = ? AND status = 'applied'
     ORDER BY changed_on, id`,
    subscriptionId,
  );
  return rows.map(toPriceChange);
};

// Αυξήσεις που περιμένουν απάντηση, μόνο αν η συνδρομή είναι ενεργή και έχει ακόμα την παλιά τιμή.
export const getPendingIncreases = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<PriceChangeRow>(
    `SELECT price_changes.* FROM price_changes
     JOIN subscriptions ON subscriptions.id = price_changes.subscription_id
     WHERE price_changes.status = 'pending'
       AND subscriptions.cancelled_at IS NULL
       AND subscriptions.price_cents = price_changes.old_cents
     ORDER BY price_changes.changed_on DESC, price_changes.id DESC`,
  );
  return rows.map(toPriceChange);
};

// «Ναι, κράτα το»: η συνδρομή παίρνει τη νέα τιμή.
export const acceptIncrease = async (db: SQLiteDatabase, change: PriceChange) => {
  await db.runAsync(
    'UPDATE subscriptions SET price_cents = ? WHERE id = ?',
    toCents(change.newPrice),
    change.subscriptionId,
  );
  await db.runAsync("UPDATE price_changes SET status = 'applied' WHERE id = ?", change.id);
};

export const dismissIncrease = async (db: SQLiteDatabase, id: number) => {
  await db.runAsync("UPDATE price_changes SET status = 'dismissed' WHERE id = ?", id);
};

type CatalogSubscriptionRow = {
  id: string;
  service_id: string;
  price_cents: number;
  cycle: string;
  plan: string | null;
};

// Το πακέτο που έχει ο χρήστης: με το όνομα αν το ξέρουμε, αλλιώς από την τιμή που πληρώνει.
const findUserPlan = (plans: ServicePlan[], row: CatalogSubscriptionRow, cycle: BillingCycle) => {
  if (row.plan) {
    const named = plans.find((plan) => plan.name === row.plan);
    if (named) return named;
  }
  const matches = plans.filter((plan) => {
    const price = getPlanPrice(plan, cycle);
    return price !== undefined && toCents(price) === row.price_cents;
  });
  // Αν δύο πακέτα έχουν την ίδια τιμή, δεν μαντεύουμε.
  return matches.length === 1 ? matches[0] : undefined;
};

// Μετά από ενημέρωση του καταλόγου: όποια συνδρομή πλήρωνε την παλιά τιμή ενός πακέτου
// που τώρα ακρίβυνε, παίρνει μια ερώτηση «Το κρατάς;».
export const detectCatalogIncreases = async (
  db: SQLiteDatabase,
  previous: Record<string, ServicePlan[]>,
  next: Record<string, ServicePlan[]>,
  today = new Date(),
) => {
  const rows = await db.getAllAsync<CatalogSubscriptionRow>(
    `SELECT id, service_id, price_cents, cycle, plan FROM subscriptions
     WHERE cancelled_at IS NULL AND is_trial = 0 AND service_id IS NOT NULL`,
  );

  let found = 0;
  for (const row of rows) {
    const oldPlans = previous[row.service_id];
    const newPlans = next[row.service_id];
    if (!oldPlans || !newPlans) continue;

    const cycle: BillingCycle = row.cycle === 'yearly' ? 'yearly' : 'monthly';
    const oldPlan = findUserPlan(oldPlans, row, cycle);
    if (!oldPlan) continue;

    const oldPrice = getPlanPrice(oldPlan, cycle);
    const newPlan = newPlans.find((plan) => plan.name === oldPlan.name);
    const newPrice = newPlan ? getPlanPrice(newPlan, cycle) : undefined;
    if (oldPrice === undefined || newPrice === undefined) continue;
    if (toCents(oldPrice) !== row.price_cents || toCents(newPrice) <= row.price_cents) continue;

    const result = await db.runAsync(
      `INSERT OR IGNORE INTO price_changes
         (subscription_id, changed_on, old_cents, new_cents, source, status)
       VALUES (?, ?, ?, ?, 'catalog', 'pending')`,
      row.id,
      toIsoDate(today),
      row.price_cents,
      toCents(newPrice),
    );
    found += result.changes;
  }
  return found;
};
