import { getLocales } from 'expo-localization';

export const MAIN_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
export const OTHER_CURRENCIES = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'RON', 'CAD', 'AUD'] as const;

export type CurrencyCode =
  | (typeof MAIN_CURRENCIES)[number]
  | (typeof OTHER_CURRENCIES)[number];

export const ALL_CURRENCIES: CurrencyCode[] = [...MAIN_CURRENCIES, ...OTHER_CURRENCIES];

// Οι τιμές του καταλόγου είναι ελληνικές, σε ευρώ.
export const CATALOG_CURRENCY: CurrencyCode = 'EUR';

const SYMBOLS: Partial<Record<CurrencyCode, string>> = { EUR: '€', USD: '$', GBP: '£' };

export const isCurrency = (value: unknown): value is CurrencyCode =>
  typeof value === 'string' && ALL_CURRENCIES.some((code) => code === value);

export const getCurrencyLabel = (code: CurrencyCode) => SYMBOLS[code] ?? code;

// Το νόμισμα της χώρας του κινητού, αν είναι ένα από αυτά που υποστηρίζουμε. Αλλιώς ευρώ.
export const getDeviceCurrency = (): CurrencyCode => {
  const code = getLocales()[0]?.currencyCode;
  return isCurrency(code) ? code : 'EUR';
};
