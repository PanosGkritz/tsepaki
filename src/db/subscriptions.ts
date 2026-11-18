import type { SQLiteDatabase } from 'expo-sqlite';
import type { BillingCycle, NewSubscription, Subscription } from '../types/subscription';

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
};

const toCycle = (value: string): BillingCycle => (value === 'yearly' ? 'yearly' : 'monthly');

const toSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  name: row.name,
  price: row.price_cents / 100,
  cycle: toCycle(row.cycle),
  nextChargeDate: row.next_charge_date,
  color: row.color,
  category: row.category,
  serviceId: row.service_id ?? undefined,
  domain: row.domain ?? undefined,
});

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const getSubscriptions = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<SubscriptionRow>(
    'SELECT * FROM subscriptions ORDER BY next_charge_date ASC',
  );
  return rows.map(toSubscription);
};

export const insertSubscription = async (db: SQLiteDatabase, subscription: NewSubscription) => {
  const id = createId();

  await db.runAsync(
    `INSERT INTO subscriptions
       (id, name, price_cents, cycle, next_charge_date, color, category, service_id, domain)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    subscription.name,
    Math.round(subscription.price * 100),
    subscription.cycle,
    subscription.nextChargeDate,
    subscription.color,
    subscription.category,
    subscription.serviceId ?? null,
    subscription.domain ?? null,
  );

  return id;
};