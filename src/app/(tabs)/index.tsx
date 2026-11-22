import { Redirect, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { MonthSummaryCard } from '../../components/MonthSummaryCard';
import { POOF_DURATION } from '../../components/PoofOut';
import { StillUsingCard } from '../../components/StillUsingCard';
import { UpcomingCharges } from '../../components/UpcomingCharges';
import { fonts, spacing } from '../../constants/theme';
import { getChargesSince, getPaidBetween, markChargesPaid } from '../../db/charges';
import { getSettings } from '../../db/settings';
import { cancelSubscription, getSubscriptions, postponeReview } from '../../db/subscriptions';
import { notifyDataChanged, onDataChanged } from '../../lib/events';
import { hapticRemove, hapticSuccess } from '../../lib/haptics';
import { buildGreeting } from '../../lib/greeting';
import { syncReminders } from '../../lib/reminders';
import { getReviewWindowStart, pickReviewCandidate } from '../../lib/review';
import { createStyles } from '../../lib/styles';
import { getMonthLabel, getMonthRange, getMonthSummary } from '../../lib/summary';
import { usePreferences } from '../../providers/PreferencesProvider';
import type { Subscription } from '../../types/subscription';

export default function Home() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { t, language, countFullShared } = usePreferences();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paid, setPaid] = useState(0);
  const [userName, setUserName] = useState('');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [review, setReview] = useState<{ subscription: Subscription; cost: number } | null>(null);
  const [reviewRemoving, setReviewRemoving] = useState(false);

  const load = useCallback(async () => {
    const settings = await getSettings(db);
    setUserName(settings.userName);
    setOnboardingDone(settings.onboardingDone);
    if (!settings.onboardingDone) return;

    await syncReminders(db);
    const { from, to } = getMonthRange();
    const [loadedSubscriptions, paidThisMonth] = await Promise.all([
      getSubscriptions(db),
      getPaidBetween(db, from, to),
    ]);

    setSubscriptions(loadedSubscriptions);
    setPaid(paidThisMonth);

    const candidate = pickReviewCandidate(loadedSubscriptions);
    const cost = candidate ? await getChargesSince(db, candidate.id, getReviewWindowStart()) : 0;
    setReview(candidate ? { subscription: candidate, cost } : null);
    setReviewRemoving(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => onDataChanged(load), [load]);

  const handleMarkPaid = async (subscription: Subscription) => {
    await markChargesPaid(db, [subscription.id], subscription.nextChargeDate);
    hapticSuccess();
    await syncReminders(db);
    await load();
  };

  const keepReviewed = async (subscription: Subscription) => {
    setReview(null);
    await postponeReview(db, subscription.id);
    await load();
  };

  const cancelReviewed = (subscription: Subscription) =>
    Alert.alert(t('review.cancelTitle'), t('review.cancelMessage', { name: subscription.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('review.cancelConfirm'),
        style: 'destructive',
        onPress: async () => {
          setReviewRemoving(true);
          hapticRemove();
          await new Promise((resolve) => setTimeout(resolve, POOF_DURATION));
          await cancelSubscription(db, subscription.id);
          await syncReminders(db);
          notifyDataChanged();
        },
      },
    ]);

  const openPaidHistory = () =>
    router.navigate({ pathname: '/history', params: { focus: 'charges' } });

  if (onboardingDone === null) return <View style={styles.screen} />;
  if (!onboardingDone) return <Redirect href="/welcome" />;

  const summary = getMonthSummary(subscriptions, paid, new Date(), countFullShared);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{buildGreeting(userName, language)}</Text>
        <Text style={styles.title}>{t('home.title')}</Text>
      </View>

      <MonthSummaryCard
        monthLabel={getMonthLabel(new Date(), language)}
        total={summary.total}
        paid={summary.paid}
        subscriptionCount={summary.count}
        onPaidPress={openPaidHistory}
      />

      <UpcomingCharges subscriptions={subscriptions} onMarkPaid={handleMarkPaid} />

      {review && (
        <StillUsingCard
          key={review.subscription.id}
          subscription={review.subscription}
          lastMonthsCost={review.cost}
          removing={reviewRemoving}
          onKeep={() => keepReviewed(review.subscription)}
          onCancel={() => cancelReviewed(review.subscription)}
        />
      )}
    </ScrollView>
  );
}

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  greeting: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
}));