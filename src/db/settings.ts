import type { SQLiteDatabase } from 'expo-sqlite';
import type { ThemeMode } from '../constants/theme';
import type { Language } from '../i18n';
import { isCurrency, type CurrencyCode } from '../lib/currency';

export type AppSettings = {
  userName: string;
  onboardingDone: boolean;
  reminderDays: number[];
  reminderHour: number;
  reminderMinute: number;
  yearlyReminder: boolean;
  themeMode: ThemeMode;
  language: Language | null;
  hideAmounts: boolean;
  appLock: boolean;
  currency: CurrencyCode | null;
  countFullShared: boolean;
  // Μόνο για δοκιμές του developer μέχρι να μπουν οι πληρωμές του Google Play.
  devPro: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  onboardingDone: false,
  reminderDays: [3, 2, 1, 0],
  reminderHour: 10,
  reminderMinute: 0,
  yearlyReminder: true,
  themeMode: 'system',
  language: null,
  hideAmounts: false,
  appLock: false,
  currency: null,
  countFullShared: false,
  devPro: false,
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

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'dark' || value === 'light';

const isLanguage = (value: unknown): value is Language => value === 'el' || value === 'en';

const isClockValue = (value: unknown, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;

const applyStoredValue = (settings: AppSettings, key: string, value: unknown): AppSettings => {
  switch (key) {
    case 'userName':
      return typeof value === 'string' ? { ...settings, userName: value } : settings;
    case 'onboardingDone':
      return typeof value === 'boolean' ? { ...settings, onboardingDone: value } : settings;
    case 'reminderDays':
      return isNumberArray(value) ? { ...settings, reminderDays: value } : settings;
    case 'reminderHour':
      return isClockValue(value, 23) ? { ...settings, reminderHour: value } : settings;
    case 'reminderMinute':
      return isClockValue(value, 59) ? { ...settings, reminderMinute: value } : settings;
    case 'yearlyReminder':
      return typeof value === 'boolean' ? { ...settings, yearlyReminder: value } : settings;
    case 'themeMode':
      return isThemeMode(value) ? { ...settings, themeMode: value } : settings;
    case 'language':
      return isLanguage(value) ? { ...settings, language: value } : settings;
    case 'hideAmounts':
      return typeof value === 'boolean' ? { ...settings, hideAmounts: value } : settings;
    case 'appLock':
      return typeof value === 'boolean' ? { ...settings, appLock: value } : settings;
    case 'currency':
      return isCurrency(value) ? { ...settings, currency: value } : settings;
    case 'countFullShared':
      return typeof value === 'boolean' ? { ...settings, countFullShared: value } : settings;
    case 'devPro':
      return typeof value === 'boolean' ? { ...settings, devPro: value } : settings;
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