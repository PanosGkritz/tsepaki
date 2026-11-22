import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { toIsoDate } from './dates';

const BACKUP_APP = 'tsepaki';
const BACKUP_VERSION = 1;
const SCHEMA_VERSION = 11;

// Το κλείδωμα αφορά τη συγκεκριμένη συσκευή, οπότε δεν μεταφέρεται.
// Ούτε οι τιμές του καταλόγου (ξανακατεβαίνουν) ούτε ο διακόπτης Pro του developer.
const DEVICE_ONLY_SETTINGS = ['appLock', 'catalogPrices', 'catalogCheckedAt', 'devPro'];

type SubscriptionBackupRow = {
  id: string;
  name: string;
  price_cents: number;
  cycle: string;
  next_charge_date: string;
  color: string;
  category: string;
  created_at: string | null;
  service_id: string | null;
  domain: string | null;
  cancelled_at: string | null;
  payment_mode: string;
  card: string | null;
  is_trial: number;
  review_after: string | null;
  share: string | null;
};

type SharePaymentBackupRow = { subscription_id: string; charge_date: string; person: string };

type ChargeBackupRow = {
  subscription_id: string;
  amount_cents: number;
  charge_date: string;
  status: string;
};

type SettingBackupRow = { key: string; value: string };

export type Backup = {
  app: typeof BACKUP_APP;
  version: number;
  schema: number;
  exportedAt: string;
  subscriptions: SubscriptionBackupRow[];
  charges: ChargeBackupRow[];
  settings: SettingBackupRow[];
  sharePayments: SharePaymentBackupRow[];
};

export type BackupSummary = {
  backup: Backup;
  activeCount: number;
  chargeCount: number;
};

export class InvalidBackupError extends Error {}
export class NewerBackupError extends Error {}

export const exportBackup = async (db: SQLiteDatabase, dialogTitle: string) => {
  const [subscriptions, charges, settings, sharePayments] = await Promise.all([
    db.getAllAsync<SubscriptionBackupRow>(
      `SELECT id, name, price_cents, cycle, next_charge_date, color, category, created_at,
              service_id, domain, cancelled_at, payment_mode, card, is_trial, review_after, share
       FROM subscriptions`,
    ),
    db.getAllAsync<ChargeBackupRow>(
      'SELECT subscription_id, amount_cents, charge_date, status FROM charges ORDER BY charge_date',
    ),
    db.getAllAsync<SettingBackupRow>('SELECT key, value FROM settings'),
    db.getAllAsync<SharePaymentBackupRow>(
      'SELECT subscription_id, charge_date, person FROM share_payments',
    ),
  ]);

  const backup: Backup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    subscriptions,
    charges,
    settings: settings.filter((row) => !DEVICE_ONLY_SETTINGS.includes(row.key)),
    sharePayments,
  };

  const file = new File(Paths.cache, `tsepaki-backup-${toIsoDate(new Date())}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle,
  });
};

export const pickBackup = async (): Promise<BackupSummary | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  const backup = parseBackup(await new File(asset.uri).text());

  return {
    backup,
    activeCount: backup.subscriptions.filter((row) => !row.cancelled_at).length,
    chargeCount: backup.charges.length,
  };
};

export const restoreBackup = async (db: SQLiteDatabase, backup: Backup) => {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM share_payments');
    await db.runAsync('DELETE FROM charges');
    await db.runAsync('DELETE FROM subscriptions');

    for (const row of backup.subscriptions) {
      await db.runAsync(
        `INSERT INTO subscriptions (id, name, price_cents, cycle, next_charge_date, color, category,
                                    created_at, service_id, domain, cancelled_at, payment_mode, card,
                                    is_trial, review_after, share)
         VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id,
        row.name,
        row.price_cents,
        row.cycle,
        row.next_charge_date,
        row.color,
        row.category,
        row.created_at,
        row.service_id,
        row.domain,
        row.cancelled_at,
        row.payment_mode,
        row.card,
        row.is_trial,
        row.review_after,
        row.share,
      );
    }

    for (const row of backup.sharePayments) {
      await db.runAsync(
        `INSERT OR IGNORE INTO share_payments (subscription_id, charge_date, person)
         VALUES (?, ?, ?)`,
        row.subscription_id,
        row.charge_date,
        row.person,
      );
    }

    for (const row of backup.charges) {
      await db.runAsync(
        `INSERT OR IGNORE INTO charges (subscription_id, amount_cents, charge_date, status)
         VALUES (?, ?, ?, ?)`,
        row.subscription_id,
        row.amount_cents,
        row.charge_date,
        row.status,
      );
    }

    for (const row of backup.settings) {
      if (DEVICE_ONLY_SETTINGS.includes(row.key)) continue;
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        row.key,
        row.value,
      );
    }
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isOptionalString = (value: unknown): value is string | null =>
  value === null || value === undefined || typeof value === 'string';
const isInteger = (value: unknown): value is number => Number.isInteger(value);

const toSubscriptionRow = (value: unknown): SubscriptionBackupRow | null => {
  if (!isRecord(value)) return null;
  const {
    id,
    name,
    price_cents,
    cycle,
    next_charge_date,
    color,
    category,
    created_at,
    service_id,
    domain,
    cancelled_at,
    payment_mode,
    card,
    is_trial,
    review_after,
    share,
  } = value;

  if (
    !isString(id) ||
    !isString(name) ||
    !isInteger(price_cents) ||
    !isString(cycle) ||
    !isString(next_charge_date) ||
    !isString(color) ||
    !isString(category) ||
    !isOptionalString(created_at) ||
    !isOptionalString(service_id) ||
    !isOptionalString(domain) ||
    !isOptionalString(cancelled_at) ||
    !isOptionalString(card) ||
    !isOptionalString(review_after) ||
    !isOptionalString(share)
  ) {
    return null;
  }

  return {
    id,
    name,
    price_cents,
    cycle,
    next_charge_date,
    color,
    category,
    created_at: created_at ?? null,
    service_id: service_id ?? null,
    domain: domain ?? null,
    cancelled_at: cancelled_at ?? null,
    payment_mode: payment_mode === 'manual' ? 'manual' : 'auto',
    card: card ?? null,
    is_trial: is_trial === 1 ? 1 : 0,
    review_after: review_after ?? null,
    share: share ?? null,
  };
};

const toSharePaymentRow = (value: unknown): SharePaymentBackupRow | null => {
  if (!isRecord(value)) return null;
  const { subscription_id, charge_date, person } = value;
  if (!isString(subscription_id) || !isString(charge_date) || !isString(person)) return null;
  return { subscription_id, charge_date, person };
};

const toChargeRow = (value: unknown): ChargeBackupRow | null => {
  if (!isRecord(value)) return null;
  const { subscription_id, amount_cents, charge_date, status } = value;
  if (!isString(subscription_id) || !isInteger(amount_cents) || !isString(charge_date)) return null;
  return { subscription_id, amount_cents, charge_date, status: isString(status) ? status : 'paid' };
};

const toSettingRow = (value: unknown): SettingBackupRow | null => {
  if (!isRecord(value)) return null;
  const { key, value: stored } = value;
  return isString(key) && isString(stored) ? { key, value: stored } : null;
};

const parseRows = <T>(value: unknown, toRow: (item: unknown) => T | null): T[] => {
  if (!Array.isArray(value)) throw new InvalidBackupError();
  return value.map((item) => {
    const row = toRow(item);
    if (!row) throw new InvalidBackupError();
    return row;
  });
};

const parseBackup = (text: string): Backup => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new InvalidBackupError();
  }

  if (!isRecord(data) || data.app !== BACKUP_APP || !isInteger(data.schema)) {
    throw new InvalidBackupError();
  }
  if (data.schema > SCHEMA_VERSION) throw new NewerBackupError();

  const subscriptions = parseRows(data.subscriptions, toSubscriptionRow);
  const ids = new Set(subscriptions.map((row) => row.id));
  const charges = parseRows(data.charges, toChargeRow).filter((row) =>
    ids.has(row.subscription_id),
  );
  const settings = data.settings === undefined ? [] : parseRows(data.settings, toSettingRow);
  const sharePayments = (
    data.sharePayments === undefined ? [] : parseRows(data.sharePayments, toSharePaymentRow)
  ).filter((row) => ids.has(row.subscription_id));

  return {
    app: BACKUP_APP,
    version: isInteger(data.version) ? data.version : BACKUP_VERSION,
    schema: data.schema,
    exportedAt: isString(data.exportedAt) ? data.exportedAt : '',
    subscriptions,
    charges,
    settings,
    sharePayments,
  };
};
