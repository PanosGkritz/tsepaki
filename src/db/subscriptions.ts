import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  BillingCycle,
  NewSubscription,
  PaymentMode,
  Subscription,
} from '../types/subscription';

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
       (id, name, price_cents, cycle, next_charge_date, color, category, service_id, domain, payment_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  );

  return id;
};

export const updateSubscription = async (
  db: SQLiteDatabase,
  id: string,
  subscription: NewSubscription,
) => {
  await db.runAsync(
    `UPDATE subscriptions
     SET name = ?, price_cents = ?, cycle = ?, next_charge_date = ?, color = ?,
         category = ?, service_id = ?, domain = ?, payment_mode = ?
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
    id,
  );
};

export const cancelSubscription = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync(
    "UPDATE subscriptions SET cancelled_at = datetime('now') WHERE id = ?",
    id,
  );
};

export const deleteSubscription = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync('DELETE FROM charges WHERE subscription_id = ?', id);
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', id);
};