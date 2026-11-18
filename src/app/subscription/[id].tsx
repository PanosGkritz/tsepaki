import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SubscriptionForm } from '../../components/SubscriptionForm';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { findService } from '../../data/services';
import { getSubscriptionTotals } from '../../db/charges';
import {
  cancelSubscription,
  deleteSubscription,
  getSubscription,
  updateSubscription,
} from '../../db/subscriptions';
import { parseIsoDate } from '../../lib/dates';
import { formatEuro } from '../../lib/format';
import { syncReminders } from '../../lib/reminders';
import { getMonthName, toAccusative } from '../../lib/stats';
import type { NewSubscription, Subscription } from '../../types/subscription';

type Totals = Awaited<ReturnType<typeof getSubscriptionTotals>>;

const describeTotals = (totals: Totals) => {
  if (totals.count === 0 || !totals.firstDate) return 'Δεν έχει χρεωθεί ακόμα μέσα από το Τσεπάκι.';

  const firstDate = parseIsoDate(totals.firstDate);
  const since = `${toAccusative(getMonthName(firstDate))} ${firstDate.getFullYear()}`;
  const times = totals.count === 1 ? '1 χρέωση' : `${totals.count} χρεώσεις`;
  return `σε ${times} από τον ${since}`;
};

export default function EditSubscription() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    getSubscription(db, id).then(setSubscription);
    getSubscriptionTotals(db, id).then(setTotals);
  }, [db, id]);

  if (!subscription) return <View style={styles.screen} />;

  const service = subscription.serviceId ? findService(subscription.serviceId) : undefined;

  const finish = async () => {
    await syncReminders(db);
    router.back();
  };

  const handleSubmit = async (values: NewSubscription) => {
    await updateSubscription(db, subscription.id, values);
    await finish();
  };

  const confirmCancel = () =>
    Alert.alert(
      'Την ακύρωσες;',
      'Σταματάω τις υπενθυμίσεις για αυτή τη συνδρομή. Οι χρεώσεις που έχουν γίνει μένουν στο ιστορικό.',
      [
        { text: 'Όχι', style: 'cancel' },
        {
          text: 'Ναι, την ακύρωσα',
          onPress: async () => {
            await cancelSubscription(db, subscription.id);
            await finish();
          },
        },
      ],
    );

  const confirmDelete = () =>
    Alert.alert(
      'Διαγραφή συνδρομής',
      'Θα σβηστεί μαζί με όλες τις χρεώσεις της. Είναι για συνδρομές που πρόσθεσες κατά λάθος.',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            await deleteSubscription(db, subscription.id);
            await finish();
          },
        },
      ],
    );

  return (
    <SubscriptionForm
      title="Επεξεργασία"
      submitLabel="Αποθήκευση αλλαγών"
      service={service}
      initial={subscription}
      onSubmit={handleSubmit}
      footer={
        <View style={styles.footer}>
          {totals && (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsLabel}>Έχεις δώσει συνολικά</Text>
              <Text style={styles.totalsAmount}>{formatEuro(totals.total)}</Text>
              <Text style={styles.totalsCaption}>{describeTotals(totals)}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={confirmCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionText}>Την ακύρωσα</Text>
            </Pressable>

            <Pressable
              onPress={confirmDelete}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.deleteText}>Διαγραφή</Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  footer: { gap: spacing.md },
  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: 2,
  },
  totalsLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  totalsAmount: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.semibold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  totalsCaption: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  actionText: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  deleteText: { color: colors.warning, fontSize: 15, fontFamily: fonts.medium },
});