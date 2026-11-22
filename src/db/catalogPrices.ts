import type { SQLiteDatabase } from 'expo-sqlite';
import { applyCatalogPrices } from '../data/services';
import { CATALOG_PRICES_URL, parseCatalogPrices } from '../lib/catalogPrices';

// Αποθηκεύονται στον πίνακα settings, αλλά δεν μπαίνουν στο αντίγραφο ασφαλείας.
export const CATALOG_CACHE_KEY = 'catalogPrices';
export const CATALOG_CHECKED_KEY = 'catalogCheckedAt';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

const readValue = async (db: SQLiteDatabase, key: string) => {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
};

const writeValue = (db: SQLiteDatabase, key: string, value: string) =>
  db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);

const parseText = (text: string | null) => {
  if (!text) return null;
  try {
    return parseCatalogPrices(JSON.parse(text));
  } catch {
    return null;
  }
};

export const loadCachedCatalogPrices = async (db: SQLiteDatabase) => {
  try {
    const prices = parseText(await readValue(db, CATALOG_CACHE_KEY));
    if (prices) applyCatalogPrices(prices);
  } catch {
    // Χωρίς αποθηκευμένες τιμές ισχύουν αυτές που είναι μέσα στην εφαρμογή.
  }
};

// Μία φορά τη μέρα κατεβάζει τις τιμές του καταλόγου. Ό,τι κι αν πάει στραβά,
// η εφαρμογή συνεχίζει με τις τιμές που έχει.
export const refreshCatalogPrices = async (db: SQLiteDatabase, now = new Date()) => {
  try {
    const checkedAt = Number(await readValue(db, CATALOG_CHECKED_KEY));
    if (Number.isFinite(checkedAt) && now.getTime() - checkedAt < CHECK_INTERVAL_MS) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(CATALOG_PRICES_URL, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeout);

    await writeValue(db, CATALOG_CHECKED_KEY, String(now.getTime()));
    if (!response.ok) return;

    const text = await response.text();
    const prices = parseText(text);
    if (!prices) return;

    applyCatalogPrices(prices);
    await writeValue(db, CATALOG_CACHE_KEY, text);
  } catch {
    // Χωρίς internet ή με χαλασμένο αρχείο κρατάμε τις τιμές που ήδη έχουμε.
  }
};
