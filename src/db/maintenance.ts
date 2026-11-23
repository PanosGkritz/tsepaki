import type { SQLiteDatabase } from 'expo-sqlite';

export const deleteAllData = async (db: SQLiteDatabase) => {
  await db.runAsync('DELETE FROM share_payments');
  await db.runAsync('DELETE FROM price_changes');
  await db.runAsync('DELETE FROM charges');
  await db.runAsync('DELETE FROM subscriptions');
};