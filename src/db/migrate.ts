import type { SQLiteDatabase } from 'expo-sqlite';
import { mockSubscriptions } from '../data/mockSubscriptions';

const DATABASE_VERSION = 1;

export const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        cycle TEXT NOT NULL,
        next_charge_date TEXT NOT NULL,
        color TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS charges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        charge_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid'
      );
    `);

    for (const subscription of mockSubscriptions) {
      await db.runAsync(
        `INSERT INTO subscriptions (id, name, price_cents, cycle, next_charge_date, color, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        subscription.id,
        subscription.name,
        Math.round(subscription.price * 100),
        subscription.cycle,
        subscription.nextChargeDate,
        subscription.color,
        subscription.category,
      );
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
};
