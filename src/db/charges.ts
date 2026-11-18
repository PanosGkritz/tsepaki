import type { SQLiteDatabase } from 'expo-sqlite';
import type { CalendarItem } from '../lib/calendar';
import { addCycle, toIsoDate } from '../lib/dates';
import { getSubscriptions } from './subscriptions';

type ChargeJoinRow = {
  charge_id: number;
  charge_date: string;
  amount_cents: number;
  subscription_id: string;
  name: string;
  cycle: string;
  next_charge_date: string;
  color: string;
  category: string;
  service_id: string | null;
  domain: string | null;
};

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

export const getSubscriptionTotals = async (db: SQLiteDatabase, subscriptionId: string) => {
  const row = await db.getFirstAsync<{
    total: number | null;
    count: number;
    first_date: string | null;
  }>(
    `SELECT SUM(amount_cents) AS total, COUNT(*) AS count, MIN(charge_date) AS first_date
     FROM charges WHERE subscription_id = ?`,
    subscriptionId,
  );

  return {
    total: (row?.total ?? 0) / 100,
    count: row?.count ?? 0,
    firstDate: row?.first_date ?? null,
  };
};

export const getChargedItems = async (db: SQLiteDatabase, fromIso: string, toIso: string) => {
  const rows = await db.getAllAsync<ChargeJoinRow>(
    `SELECT c.id AS charge_id, c.charge_date, c.amount_cents,
            s.id AS subscription_id, s.name, s.cycle, s.next_charge_date,
            s.color, s.category, s.service_id, s.domain
     FROM charges c
     JOIN subscriptions s ON s.id = c.subscription_id
     WHERE c.charge_date >= ? AND c.charge_date <= ?
     ORDER BY c.charge_date ASC`,
    fromIso,
    toIso,
  );

  return rows.map(
    (row): CalendarItem => ({
      key: `charge-${row.charge_id}`,
      date: row.charge_date,
      amount: row.amount_cents / 100,
      status: 'paid',
      subscription: {
        id: row.subscription_id,
        name: row.name,
        price: row.amount_cents / 100,
        cycle: row.cycle === 'yearly' ? 'yearly' : 'monthly',
        nextChargeDate: row.next_charge_date,
        color: row.color,
        category: row.category,
        serviceId: row.service_id ?? undefined,
        domain: row.domain ?? undefined,
      },
    }),
  );
};