import type { SQLiteDatabase } from 'expo-sqlite';
import type { BillingCycle, Subscription } from '../types/subscription';

type SubscriptionRow = {
  id: string;
  name: string;
  price_cents: number;
  cycle: string;
  next_charge_date: string;
  color: string;
  category: string;
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
});

export const getSubscriptions = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<SubscriptionRow>(
    'SELECT * FROM subscriptions ORDER BY next_charge_date ASC',
  );
  return rows.map(toSubscription);
};
