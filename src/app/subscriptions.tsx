import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SubscriptionRow } from '../components/SubscriptionRow';
import { fonts, radius, spacing } from '../constants/theme';
import { getSubscriptions } from '../db/subscriptions';
import type { StringKey } from '../i18n';
import { getCostTotals } from '../lib/costs';
import { formatChargeDay } from '../lib/dates';
import { formatEuro } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { BillingCycle, Subscription } from '../types/subscription';

const CYCLE_KEYS: Record<BillingCycle, StringKey> = {
  monthly: 'form.monthly',
  yearly: 'form.yearly',
};

export default function Subscriptions() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language } = usePreferences();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSubscriptions(db).then(setSubscriptions);
    }, [db]),
  );

  const totals = getCostTotals(subscriptions);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('list.back')}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>{t('list.title')}</Text>

      <View style={styles.totals}>
        <Total label={t('list.monthly')} value={formatEuro(totals.monthly, language)} />
        <Total label={t('list.yearly')} value={formatEuro(totals.yearly, language)} />
      </View>

      {subscriptions.length === 0 ? (
        <Text style={styles.empty}>{t('upcoming.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {subscriptions.map((subscription, index) => (
            <SubscriptionRow
              key={subscription.id}
              subscription={subscription}
              showDivider={index < subscriptions.length - 1}
              onPress={() =>
                router.push({ pathname: '/subscription/[id]', params: { id: subscription.id } })
              }
              subtitle={t('list.subtitle', {
                cycle: t(CYCLE_KEYS[subscription.cycle]),
                day: formatChargeDay(subscription.nextChargeDate, language),
              })}
            />
          ))}
        </View>
      )}

      <Text style={styles.note}>{t('list.note')}</Text>
    </ScrollView>
  );
}

type TotalProps = { label: string; value: string };

const Total = ({ label, value }: TotalProps) => {
  const styles = useStyles();
  return (
    <View style={styles.total}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  totals: { flexDirection: 'row', gap: spacing.sm },
  total: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  totalLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  totalValue: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
  note: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
}));