import { Redirect, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MonthSummaryCard } from '../../components/MonthSummaryCard';
import { UpcomingCharges } from '../../components/UpcomingCharges';
import { colors, fonts, spacing } from '../../constants/theme';
import { getPaidBetween } from '../../db/charges';
import { getSettings } from '../../db/settings';
import { getSubscriptions } from '../../db/subscriptions';
import { buildGreeting } from '../../lib/greeting';
import { syncReminders } from '../../lib/reminders';
import { getMonthLabel, getMonthRange, getMonthSummary } from '../../lib/summary';
import type { Subscription } from '../../types/subscription';

export default function Home() {
  const db = useSQLiteContext();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paid, setPaid] = useState(0);
  const [userName, setUserName] = useState('');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        const settings = await getSettings(db);
        if (!isActive) return;
        setUserName(settings.userName);
        setOnboardingDone(settings.onboardingDone);
        if (!settings.onboardingDone) return;

        await syncReminders(db);
        const { from, to } = getMonthRange();
        const [loadedSubscriptions, paidThisMonth] = await Promise.all([
          getSubscriptions(db),
          getPaidBetween(db, from, to),
        ]);

        if (!isActive) return;
        setSubscriptions(loadedSubscriptions);
        setPaid(paidThisMonth);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [db]),
  );

  if (onboardingDone === null) return <View style={styles.screen} />;
  if (!onboardingDone) return <Redirect href="/welcome" />;

  const summary = getMonthSummary(subscriptions, paid);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{buildGreeting(userName)}</Text>
        <Text style={styles.title}>Το Τσεπάκι μου</Text>
      </View>

      <MonthSummaryCard
        monthLabel={getMonthLabel()}
        total={summary.total}
        paid={summary.paid}
        subscriptionCount={summary.count}
      />

      <UpcomingCharges subscriptions={subscriptions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});