import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  BillingCycle,
  NewSubscription,
  PaymentMode,
  Subscription,
} from '../types/subscription';
import { addMonths, toIsoDate } from '../lib/dates';
import { REVIEW_AFTER_MONTHS } from '../lib/review';
import { recordManualPriceChange } from './priceChanges';
import { parseShare, serializeShare } from '../lib/share';

type SubscriptionRow = {
  id: string;
  name: string;
  price_cents: number;
  cycle: string;
  next_charge_date: string;
  color: string;
  category: string;
  service_id: string | null;
  domain: string | null;
  payment_mode: string;
  card: string | null;
  is_trial: number;
  created_at: string | null;
  review_after: string | null;
  share: string | null;
  plan: string | null;
  cancelled_at?: string | null;
};

const toCycle = (value: string): BillingCycle => (value === 'yearly' ? 'yearly' : 'monthly');

export const toPaymentMode = (value: string): PaymentMode =>
  value === 'manual' ? 'manual' : 'auto';

const toSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  name: row.name,
  price: row.price_cents / 100,
  cycle: toCycle(row.cycle),
  nextChargeDate: row.next_charge_date,
  color: row.color,
  category: row.category,
  paymentMode: toPaymentMode(row.payment_mode),
  serviceId: row.service_id ?? undefined,
  domain: row.domain ?? undefined,
  card: row.card ?? undefined,
  isTrial: row.is_trial === 1,
  share: parseShare(row.share),
  plan: row.plan ?? undefined,
  createdAt: row.created_at ? row.created_at.slice(0, 10) : undefined,
  reviewAfter: row.review_after ?? undefined,
});

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const getSubscriptions = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<SubscriptionRow>(
    'SELECT * FROM subscriptions WHERE cancelled_at IS NULL ORDER BY next_charge_date ASC',
  );
  return rows.map(toSubscription);
};

export const getSubscription = async (db: SQLiteDatabase, id: string) => {
  const row = await db.getFirstAsync<SubscriptionRow>('SELECT * FROM subscriptions WHERE id = ?', id);
  return row ? toSubscription(row) : null;
};

export const insertSubscription = async (db: SQLiteDatabase, subscription: NewSubscription) => {
  const id = createId();

  await db.runAsync(
    `INSERT INTO subscriptions
       (id, name, price_cents, cycle, next_charge_date, color, category, service_id, domain,
        payment_mode, card, is_trial, share, plan)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    subscription.name,
    Math.round(subscription.price * 100),
    subscription.cycle,
    subscription.nextChargeDate,
    subscription.color,
    subscription.category,
    subscription.serviceId ?? null,
    subscription.domain ?? null,
    subscription.paymentMode,
    subscription.card ?? null,
    subscription.isTrial ? 1 : 0,
    serializeShare(subscription.share),
    subscription.plan ?? null,
  );

  return id;
};

export const updateSubscription = async (
  db: SQLiteDatabase,
  id: string,
  subscription: NewSubscription,
) => {
  const previous = await getSubscription(db, id);

  await db.runAsync(
    `UPDATE subscriptions
     SET name = ?, price_cents = ?, cycle = ?, next_charge_date = ?, color = ?,
         category = ?, service_id = ?, domain = ?, payment_mode = ?, card = ?, is_trial = ?,
         share = ?, plan = ?
     WHERE id = ?`,
    subscription.name,
    Math.round(subscription.price * 100),
    subscription.cycle,
    subscription.nextChargeDate,
    subscription.color,
    subscription.category,
    subscription.serviceId ?? null,
    subscription.domain ?? null,
    subscription.paymentMode,
    subscription.card ?? null,
    subscription.isTrial ? 1 : 0,
    serializeShare(subscription.share),
    subscription.plan ?? null,
    id,
  );

  // Ιστορικό τιμών (Pro): κρατάμε κάθε αλλαγή τιμής στην ίδια συχνότητα.
  if (previous && previous.cycle === subscription.cycle) {
    await recordManualPriceChange(db, id, previous.price, subscription.price);
  }
};

// Οι κάρτες που έχει ήδη γράψει ο χρήστης, για γρήγορη επιλογή στη φόρμα.
export const getCardLabels = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<{ card: string }>(
    `SELECT card FROM subscriptions
     WHERE card IS NOT NULL AND card <> ''
     GROUP BY card
     ORDER BY COUNT(*) DESC, card ASC`,
  );
  return rows.map((row) => row.card);
};

export const cancelSubscription = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync(
    "UPDATE subscriptions SET cancelled_at = datetime('now') WHERE id = ?",
    id,
  );
};

// «Ναι, το κρατάω»: η ερώτηση ξαναέρχεται σε 4 μήνες.
export const postponeReview = async (db: SQLiteDatabase, id: string, today = new Date()) => {
  await db.runAsync(
    'UPDATE subscriptions SET review_after = ? WHERE id = ?',
    addMonths(toIsoDate(today), REVIEW_AFTER_MONTHS),
    id,
  );
};

export type CancelledSubscription = Subscription & { cancelledAt: string };

export const getCancelledSince = async (db: SQLiteDatabase, fromIso: string) => {
  const rows = await db.getAllAsync<SubscriptionRow & { cancelled_at: string }>(
    'SELECT * FROM subscriptions WHERE cancelled_at IS NOT NULL AND cancelled_at >= ?',
    fromIso,
  );
  return rows.map(
    (row): CancelledSubscription => ({
      ...toSubscription(row),
      cancelledAt: row.cancelled_at.slice(0, 10),
    }),
  );
};

export const deleteSubscription = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync('DELETE FROM price_changes WHERE subscription_id = ?', id);
  await db.runAsync('DELETE FROM share_payments WHERE subscription_id = ?', id);
  await db.runAsync('DELETE FROM charges WHERE subscription_id = ?', id);
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', id);
};