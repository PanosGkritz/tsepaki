import type { SQLiteDatabase } from 'expo-sqlite';
import { addCycle, toIsoDate } from '../lib/dates';
import { getSubscriptions } from './subscriptions';

export const processDueCharges = async (db: SQLiteDatabase, today = new Date()) => {
  const todayIso = toIsoDate(today);
  const subscriptions = await getSubscriptions(db);

  for (const subscription of subscriptions) {
    let nextDate = subscription.nextChargeDate;
    if (nextDate >= todayIso) continue;

    while (nextDate < todayIso) {
      await db.runAsync(
        `INSERT OR IGNORE INTO charges (subscription_id, amount_cents, charge_date)
         VALUES (?, ?, ?)`,
        subscription.id,
        Math.round(subscription.price * 100),
        nextDate,
      );
      nextDate = addCycle(nextDate, subscription.cycle);
    }

    await db.runAsync(
      'UPDATE subscriptions SET next_charge_date = ? WHERE id = ? AND next_charge_date = ?',
      nextDate,
      subscription.id,
      subscription.nextChargeDate,
    );
  }
};

export const getPaidBetween = async (db: SQLiteDatabase, fromIso: string, toIso: string) => {
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount_cents) AS total FROM charges WHERE charge_date >= ? AND charge_date <= ?',
    fromIso,
    toIso,
  );
  return (row?.total ?? 0) / 100;
};