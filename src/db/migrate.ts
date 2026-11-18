import type { SQLiteDatabase } from 'expo-sqlite';
import { mockSubscriptions } from '../data/mockSubscriptions';

const DATABASE_VERSION = 6;

export const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

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

    currentVersion = 1;
  }

  if (currentVersion === 1) {
    await db.execAsync(`
      ALTER TABLE subscriptions ADD COLUMN service_id TEXT;
      ALTER TABLE subscriptions ADD COLUMN domain TEXT;
      UPDATE subscriptions SET service_id = id WHERE service_id IS NULL;
    `);

    currentVersion = 2;
  }

  if (currentVersion === 2) {
    await db.execAsync(`
      UPDATE subscriptions
      SET service_id = 'telekom', domain = 'telekom.gr', color = '#E20074',
          name = CASE WHEN name = 'Cosmote' THEN 'Telekom' ELSE name END
      WHERE service_id = 'cosmote';
    `);

    currentVersion = 3;
  }

  if (currentVersion === 3) {
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS charges_subscription_date
      ON charges (subscription_id, charge_date);
    `);

    currentVersion = 4;
  }

  if (currentVersion === 4) {
    await db.execAsync(`ALTER TABLE subscriptions ADD COLUMN cancelled_at TEXT;`);

    currentVersion = 5;
  }

  if (currentVersion === 5) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    currentVersion = 6;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
};