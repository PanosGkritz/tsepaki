import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState, Share } from 'react-native';
import { refreshCatalogPrices } from '../db/catalogPrices';
import { markChargesPaid } from '../db/charges';
import { getSettings } from '../db/settings';
import { getSubscription } from '../db/subscriptions';
import { buildShareMessage } from '../lib/shareMessage';
import { notifyDataChanged } from '../lib/events';
import { PAID_ACTION, readChargePayload, readTapData } from '../lib/notifications';
import { resolveLanguage, syncReminders } from '../lib/reminders';
import type { SQLiteDatabase } from 'expo-sqlite';

const openShareSheet = async (db: SQLiteDatabase, subscriptionId: string) => {
  const [subscription, settings] = await Promise.all([
    getSubscription(db, subscriptionId),
    getSettings(db),
  ]);
  if (!subscription?.share) return;

  await Share.share({ message: buildShareMessage(subscription, resolveLanguage(settings)) });
};

export const ReminderSync = () => {
  const db = useSQLiteContext();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    // Αν οι νέες τιμές του καταλόγου έφεραν αυξήσεις, ξαναχτίζονται οι ειδοποιήσεις
    // (για το «Το κρατάς;») και ενημερώνεται η αρχική.
    const refreshCatalog = () =>
      refreshCatalogPrices(db).then((foundIncreases) => {
        if (foundIncreases) syncReminders(db).then(notifyDataChanged);
      });

    syncReminders(db);
    refreshCatalog();

    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      syncReminders(db).then(notifyDataChanged);
      refreshCatalog();
    });

    return () => listener.remove();
  }, [db]);

  useEffect(() => {
    if (!lastResponse) return;
    const { data } = lastResponse.notification.request.content;

    if (lastResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const tap = readTapData(data);
      if (tap?.kind === 'home') router.navigate('/');
      if (tap?.kind === 'share') {
        openShareSheet(db, tap.subscriptionId).catch(() => {
          // Αν δεν ανοίξει, ο χρήστης μπορεί να στείλει το μήνυμα από τη σελίδα της συνδρομής.
        });
      }
      return;
    }

    if (lastResponse.actionIdentifier !== PAID_ACTION) return;

    const payload = readChargePayload(data);
    if (!payload || payload.subscriptionIds.length === 0) return;

    markChargesPaid(db, payload.subscriptionIds, payload.chargeDate)
      .then(() => syncReminders(db))
      .then(notifyDataChanged)
      .catch(() => {
        // Αν αποτύχει, η χρέωση θα καταγραφεί αυτόματα την επόμενη μέρα.
      });
  }, [db, lastResponse]);

  return null;
};
