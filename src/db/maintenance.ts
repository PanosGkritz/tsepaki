import type { SQLiteDatabase } from 'expo-sqlite';

export const deleteAllData = async (db: SQLiteDatabase) => {
  await db.runAsync('DELETE FROM charges');
  await db.runAsync('DELETE FROM subscriptions');
};