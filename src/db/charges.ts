import type { SQLiteDatabase } from 'expo-sqlite';
import { addCycle, toIsoDate } from '../lib/dates';
import { getSubscriptions } from './subscriptions';

const recordCharge = async (
  db: SQLiteDatabase,
  subscriptionId: string,
  price: number,
  chargeDate: string,
) => {
  await db.runAsync(
    `INSERT OR IGNORE INTO charges (subscription_id, amount_cents, charge_date)
     VALUES (?, ?, ?)`,
    subscriptionId,
    Math.round(price * 100),
    chargeDate,
  );
};

const moveNextChargeDate = async (
  db: SQLiteDatabase,
  subscriptionId: string,
  fromDate: string,
  toDate: string,
) => {
  await db.runAsync(
    'UPDATE subscriptions SET next_charge_date = ? WHERE id = ? AND next_charge_date = ?',
    toDate,
    subscriptionId,
    fromDate,
  );
};

export const processDueCharges = async (db: SQLiteDatabase, today = new Date()) => {
  const todayIso = toIsoDate(today);
  const subscriptions = await getSubscriptions(db);

  for (const subscription of subscriptions) {
    let nextDate = subscription.nextChargeDate;
    if (nextDate >= todayIso) continue;

    while (nextDate < todayIso) {
      await recordCharge(db, subscription.id, subscription.price, nextDate);
      nextDate = addCycle(nextDate, subscription.cycle);
    }

    await moveNextChargeDate(db, subscription.id, subscription.nextChargeDate, nextDate);
  }
};

export const markChargesPaid = async (
  db: SQLiteDatabase,
  subscriptionIds: string[],
  chargeDate: string,
) => {
  const subscriptions = await getSubscriptions(db);

  for (const subscription of subscriptions) {
    if (!subscriptionIds.includes(subscription.id)) continue;
    if (subscription.nextChargeDate !== chargeDate) continue;

    await recordCharge(db, subscription.id, subscription.price, chargeDate);
    await moveNextChargeDate(db, subscription.id, chargeDate, addCycle(chargeDate, subscription.cycle));
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