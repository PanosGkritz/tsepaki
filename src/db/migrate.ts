import type { SQLiteDatabase } from 'expo-sqlite';
import { seedDemoData } from '../data/demoSeed';

const DATABASE_VERSION = 12;

// Οι βάσεις για εγγραφές οθόνης (src/app/_layout.tsx → databaseName="tsepaki-demo.db",
// «tsepaki-demo2.db» κ.λπ. για να ξεκινήσει από την αρχή) γεμίζουν με παραδείγματα.
// Η κανονική βάση ξεκινάει πάντα άδεια.
const DEMO_DATABASE = /tsepaki-demo\d*\.db$/;

export const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  const isFreshDatabase = currentVersion === 0;

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

  if (currentVersion === 6) {
    await db.execAsync(`
      UPDATE subscriptions SET category = CASE category
        WHEN 'Streaming' THEN 'streaming'
        WHEN 'Μουσική' THEN 'music'
        WHEN 'Gaming' THEN 'gaming'
        WHEN 'AI' THEN 'ai'
        WHEN 'Αποθήκευση' THEN 'storage'
        WHEN 'Κινητό' THEN 'mobile'
        WHEN 'TV' THEN 'tv'
        WHEN 'Δραστηριότητες' THEN 'activities'
        ELSE 'other'
      END;
    `);

    currentVersion = 7;
  }

  if (currentVersion === 7) {
    await db.execAsync(`
      ALTER TABLE subscriptions ADD COLUMN payment_mode TEXT NOT NULL DEFAULT 'auto';
      UPDATE subscriptions SET payment_mode = 'manual' WHERE category = 'activities';
    `);

    currentVersion = 8;
  }

  if (currentVersion === 8) {
    await db.execAsync(`ALTER TABLE subscriptions ADD COLUMN card TEXT;`);

    currentVersion = 9;
  }

  if (currentVersion === 9) {
    await db.execAsync(
      `ALTER TABLE subscriptions ADD COLUMN is_trial INTEGER NOT NULL DEFAULT 0;`,
    );

    currentVersion = 10;
  }

  if (currentVersion === 10) {
    await db.execAsync(`
      ALTER TABLE subscriptions ADD COLUMN review_after TEXT;
      ALTER TABLE subscriptions ADD COLUMN share TEXT;

      CREATE TABLE IF NOT EXISTS share_payments (
        subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        charge_date TEXT NOT NULL,
        person TEXT NOT NULL,
        PRIMARY KEY (subscription_id, charge_date, person)
      );
    `);

    currentVersion = 11;
  }

  if (currentVersion === 11) {
    await db.execAsync(`
      ALTER TABLE subscriptions ADD COLUMN plan TEXT;

      CREATE TABLE IF NOT EXISTS price_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        changed_on TEXT NOT NULL,
        old_cents INTEGER NOT NULL,
        new_cents INTEGER NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'applied'
      );

      CREATE UNIQUE INDEX IF NOT EXISTS price_changes_catalog
        ON price_changes (subscription_id, new_cents) WHERE source = 'catalog';
    `);

    currentVersion = 12;
  }

  if (isFreshDatabase && DEMO_DATABASE.test(db.databasePath)) {
    await seedDemoData(db);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
};
