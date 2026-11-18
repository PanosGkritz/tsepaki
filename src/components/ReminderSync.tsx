import * as Notifications from 'expo-notifications';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { markChargesPaid } from '../db/charges';
import { PAID_ACTION, readChargePayload } from '../lib/notifications';
import { syncReminders } from '../lib/reminders';

export const ReminderSync = () => {
  const db = useSQLiteContext();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    syncReminders(db);

    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncReminders(db);
    });

    return () => listener.remove();
  }, [db]);

  useEffect(() => {
    if (lastResponse?.actionIdentifier !== PAID_ACTION) return;

    const payload = readChargePayload(lastResponse.notification.request.content.data);
    if (!payload) return;

    markChargesPaid(db, payload.subscriptionIds, payload.chargeDate)
      .then(() => syncReminders(db))
      .catch(() => {
        // Αν αποτύχει, η χρέωση θα καταγραφεί αυτόματα την επόμενη μέρα.
      });
  }, [db, lastResponse]);

  return null;
};