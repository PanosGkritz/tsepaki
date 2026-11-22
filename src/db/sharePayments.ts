import type { SQLiteDatabase } from 'expo-sqlite';

// Ποιος σού έδωσε το μερίδιό του σε κάθε χρέωση μιας κοινής συνδρομής.
export const getSharePayments = async (db: SQLiteDatabase, subscriptionId: string) => {
  const rows = await db.getAllAsync<{ charge_date: string; person: string }>(
    'SELECT charge_date, person FROM share_payments WHERE subscription_id = ?',
    subscriptionId,
  );

  const paid = new Map<string, Set<string>>();
  for (const row of rows) {
    const people = paid.get(row.charge_date) ?? new Set<string>();
    people.add(row.person);
    paid.set(row.charge_date, people);
  }
  return paid;
};

export const setSharePaid = async (
  db: SQLiteDatabase,
  subscriptionId: string,
  chargeDate: string,
  person: string,
  isPaid: boolean,
) => {
  if (isPaid) {
    await db.runAsync(
      'INSERT OR IGNORE INTO share_payments (subscription_id, charge_date, person) VALUES (?, ?, ?)',
      subscriptionId,
      chargeDate,
      person,
    );
    return;
  }

  await db.runAsync(
    'DELETE FROM share_payments WHERE subscription_id = ? AND charge_date = ? AND person = ?',
    subscriptionId,
    chargeDate,
    person,
  );
};
