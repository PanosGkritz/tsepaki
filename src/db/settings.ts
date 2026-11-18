import type { SQLiteDatabase } from 'expo-sqlite';

export type AppSettings = {
  userName: string;
  onboardingDone: boolean;
  reminderDays: number[];
  reminderHour: number;
  yearlyReminder: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  onboardingDone: false,
  reminderDays: [3, 2, 1, 0],
  reminderHour: 10,
  yearlyReminder: true,
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number');

const applyStoredValue = (settings: AppSettings, key: string, value: unknown): AppSettings => {
  switch (key) {
    case 'userName':
      return typeof value === 'string' ? { ...settings, userName: value } : settings;
    case 'onboardingDone':
      return typeof value === 'boolean' ? { ...settings, onboardingDone: value } : settings;
    case 'reminderDays':
      return isNumberArray(value) ? { ...settings, reminderDays: value } : settings;
    case 'reminderHour':
      return typeof value === 'number' ? { ...settings, reminderHour: value } : settings;
    case 'yearlyReminder':
      return typeof value === 'boolean' ? { ...settings, yearlyReminder: value } : settings;
    default:
      return settings;
  }
};

export const getSettings = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  return rows.reduce(
    (settings, row) => applyStoredValue(settings, row.key, parseJson(row.value)),
    DEFAULT_SETTINGS,
  );
};

export const saveSetting = async <K extends keyof AppSettings>(
  db: SQLiteDatabase,
  key: K,
  value: AppSettings[K],
) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    JSON.stringify(value),
  );
};