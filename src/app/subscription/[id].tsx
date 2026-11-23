import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { PriceHistory } from '../../components/PriceHistory';
import { SharePayments } from '../../components/SharePayments';
import { SubscriptionForm } from '../../components/SubscriptionForm';
import { fonts, radius, spacing } from '../../constants/theme';
import { findService } from '../../data/services';
import { getSubscriptionTotals, markChargesPaid } from '../../db/charges';
import {
  cancelSubscription,
  deleteSubscription,
  getSubscription,
  updateSubscription,
} from '../../db/subscriptions';
import type { Language, Translate } from '../../i18n';
import { daysUntil, formatChargeDay, parseIsoDate } from '../../lib/dates';
import { notifyDataChanged } from '../../lib/events';
import { formatEuro } from '../../lib/format';
import { hapticRemove, hapticSuccess } from '../../lib/haptics';
import { syncReminders } from '../../lib/reminders';
import { getMonthName, toAccusative } from '../../lib/stats';
import { createStyles } from '../../lib/styles';
import { usePreferences } from '../../providers/PreferencesProvider';
import type { NewSubscription, Subscription } from '../../types/subscription';

const EARLY_PAYMENT_DAYS = 3;

type Totals = Awaited<ReturnType<typeof getSubscriptionTotals>>;

const describeTotals = (totals: Totals, t: Translate, language: Language) => {
  if (totals.count === 0 || !totals.firstDate) return t('edit.totalsNone');

  const firstDate = parseIsoDate(totals.firstDate);
  const monthName = getMonthName(firstDate, language);
  const since = `${language === 'el' ? toAccusative(monthName) : monthName} ${firstDate.getFullYear()}`;

  return totals.count === 1
    ? t('edit.totalsOne', { since })
    : t('edit.totalsMany', { count: totals.count, since });
};

export default function EditSubscription() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language } = usePreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    getSubscription(db, id).then(setSubscription);
    getSubscriptionTotals(db, id).then(setTotals);
  }, [db, id]);

  if (!subscription) return <View style={styles.screen} />;

  const service = subscription.serviceId ? findService(subscription.serviceId) : undefined;
  const daysToCharge = daysUntil(subscription.nextChargeDate);
  const canMarkPaid =
    subscription.paymentMode === 'manual' && daysToCharge <= EARLY_PAYMENT_DAYS;

  const finish = async () => {
    await syncReminders(db);
    notifyDataChanged();
    router.back();
  };

  const handleSubmit = async (values: NewSubscription) => {
    await updateSubscription(db, subscription.id, values);
    await finish();
  };

  const handleMarkPaid = async () => {
    await markChargesPaid(db, [subscription.id], subscription.nextChargeDate);
    hapticSuccess();
    await finish();
  };

  const confirmCancel = () =>
    Alert.alert(t('edit.cancelTitle'), t('edit.cancelMessage'), [
      { text: t('edit.cancelNo'), style: 'cancel' },
      {
        text: t('edit.cancelYes'),
        onPress: async () => {
          await cancelSubscription(db, subscription.id);
          hapticRemove();
          await finish();
        },
      },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('edit.deleteTitle'), t('edit.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('edit.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSubscription(db, subscription.id);
          hapticRemove();
          await finish();
        },
      },
    ]);

  return (
    <SubscriptionForm
      title={t('form.titleEdit')}
      submitLabel={t('form.submitEdit')}
      service={service}
      initial={subscription}
      onSubmit={handleSubmit}
      footer={
        <View style={styles.footer}>
          {canMarkPaid && (
            <Pressable
              onPress={handleMarkPaid}
              accessibilityRole="button"
              style={({ pressed }) => [styles.paidButton, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.accentBright} />
              <Text style={styles.paidText}>
                {t('edit.markPaid', {
                  day: formatChargeDay(subscription.nextChargeDate, language),
                })}
              </Text>
            </Pressable>
          )}

          {subscription.share && !subscription.share.payer && (
            <SharePayments subscription={subscription} />
          )}

          <PriceHistory subscription={subscription} />

          {totals && (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsLabel}>{t('edit.totalsLabel')}</Text>
              <Text style={styles.totalsAmount}>{formatEuro(totals.total, language)}</Text>
              <Text style={styles.totalsCaption}>{describeTotals(totals, t, language)}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={confirmCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionText}>{t('edit.cancelled')}</Text>
            </Pressable>

            <Pressable
              onPress={confirmDelete}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.deleteText}>{t('edit.delete')}</Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  footer: { gap: spacing.md },
  paidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  paidText: { color: colors.accentBright, fontSize: 15, fontFamily: fonts.semibold },
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
}));