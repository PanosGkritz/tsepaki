import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SubscriptionForm } from '../../components/SubscriptionForm';
import { findService } from '../../data/services';
import { insertSubscription } from '../../db/subscriptions';
import { requestPermission } from '../../lib/notifications';
import { syncReminders } from '../../lib/reminders';
import { usePreferences } from '../../providers/PreferencesProvider';
import type { NewSubscription as NewSubscriptionValues } from '../../types/subscription';

const enableReminders = async () => {
  try {
    await requestPermission();
  } catch {
    // Αν δεν δοθεί άδεια, η συνδρομή αποθηκεύεται κανονικά.
  }
};

export default function NewSubscription() {
  const db = useSQLiteContext();
  const { t } = usePreferences();
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const service = serviceId ? findService(serviceId) : undefined;

  const handleSubmit = async (values: NewSubscriptionValues) => {
    await insertSubscription(db, values);
    await enableReminders();
    await syncReminders(db);
    router.back();
  };

  return (
    <SubscriptionForm
      title={service ? t('form.titleNew') : t('form.titleManual')}
      submitLabel={t('form.submitNew')}
      service={service}
      onSubmit={handleSubmit}
    />
  );
}