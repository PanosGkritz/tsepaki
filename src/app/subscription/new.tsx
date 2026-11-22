import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';
import { SubscriptionForm } from '../../components/SubscriptionForm';
import { SUCCESS_DURATION, SuccessCheck } from '../../components/SuccessCheck';
import { findService } from '../../data/services';
import { insertSubscription } from '../../db/subscriptions';
import { hapticSuccess } from '../../lib/haptics';
import { requestPermission } from '../../lib/notifications';
import { syncReminders } from '../../lib/reminders';
import { usePreferences } from '../../providers/PreferencesProvider';
import type { NewSubscription as NewSubscriptionValues } from '../../types/subscription';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (values: NewSubscriptionValues) => {
    await insertSubscription(db, values);
    hapticSuccess();
    setSaved(true);
    const shown = wait(SUCCESS_DURATION);
    await enableReminders();
    await syncReminders(db);
    await shown;
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <SubscriptionForm
        title={service ? t('form.titleNew') : t('form.titleManual')}
        submitLabel={t('form.submitNew')}
        service={service}
        onSubmit={handleSubmit}
      />
      {saved && <SuccessCheck label={t('form.added')} />}
    </View>
  );
}