import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryBreakdown } from '../../components/CategoryBreakdown';
import { MonthlyBars } from '../../components/MonthlyBars';
import { SubscriptionRow } from '../../components/SubscriptionRow';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getChargedItems } from '../../db/charges';
import { getSubscriptions } from '../../db/subscriptions';
import type { CalendarItem } from '../../lib/calendar';
import { formatChargeDay, parseIsoDate, toIsoDate } from '../../lib/dates';
import { formatEuro } from '../../lib/format';
import { syncReminders } from '../../lib/reminders';
import { getCategoryBreakdown, getMonthlyTotals } from '../../lib/stats';
import { getMonthLabel } from '../../lib/summary';
import type { Subscription } from '../../types/subscription';

type MonthGroup = {
  key: string;
  label: string;
  total: number;
  items: CalendarItem[];
};

const sumAmounts = (items: CalendarItem[]) => items.reduce((sum, item) => sum + item.amount, 0);

const groupByMonth = (items: CalendarItem[]): MonthGroup[] => {
  const groups = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, monthItems]) => ({
      key,
      label: getMonthLabel(parseIsoDate(`${key}-01`)),
      total: sumAmounts(monthItems),
      items: [...monthItems].sort((a, b) => b.date.localeCompare(a.date)),
    }));
};

const openSubscription = (id: string) =>
  router.push({ pathname: '/subscription/[id]', params: { id } });

export default function History() {
  const db = useSQLiteContext();
  const [charges, setCharges] = useState<CalendarItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [query, setQuery] = useState('');

  const year = new Date().getFullYear();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        await syncReminders(db);
        const [loadedCharges, loadedSubscriptions] = await Promise.all([
          getChargedItems(db, '0000-01-01', toIsoDate(new Date())),
          getSubscriptions(db),
        ]);

        if (!isActive) return;
        setCharges(loadedCharges);
        setSubscriptions(loadedSubscriptions);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [db]),
  );

  const chargesThisYear = charges.filter((item) => item.date.startsWith(`${year}-`));
  const paidThisYear = sumAmounts(chargesThisYear);
  const monthsWithCharges = new Set(chargesThisYear.map((item) => item.date.slice(0, 7))).size;
  const monthlyAverage = monthsWithCharges > 0 ? paidThisYear / monthsWithCharges : 0;

  const monthlyTotals = getMonthlyTotals(charges, subscriptions);
  const categories = getCategoryBreakdown(subscriptions);

  const normalizedQuery = query.trim().toLocaleLowerCase('el');
  const visibleCharges = charges.filter((item) =>
    item.subscription.name.toLocaleLowerCase('el').includes(normalizedQuery),
  );
  const groups = groupByMonth(visibleCharges);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Ιστορικό</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Πλήρωσες φέτος</Text>
        <Text style={styles.yearPaid}>{formatEuro(paidThisYear)}</Text>

        <View style={styles.stats}>
          <Stat label="Χρεώσεις" value={String(chargesThisYear.length)} />
          <Stat label="Μέσος όρος / μήνα" value={formatEuro(monthlyAverage)} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ανά μήνα</Text>
      <View style={styles.card}>
        <MonthlyBars months={monthlyTotals} />
      </View>

      {categories.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Πού πάνε τα λεφτά σου</Text>
          <View style={styles.card}>
            <CategoryBreakdown items={categories} />
            <Text style={styles.cardNote}>Μηνιαίο κόστος των ενεργών συνδρομών σου.</Text>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Όλες οι χρεώσεις</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Αναζήτηση, π.χ. Netflix"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Αναζήτηση στο ιστορικό"
        />
      </View>

      {charges.length === 0 && (
        <Text style={styles.empty}>
          Δεν υπάρχουν ακόμα χρεώσεις. Καταγράφονται μόνες τους μόλις περάσει η μέρα χρέωσης, ή
          όταν πατάς «Το πλήρωσα» στην ειδοποίηση.
        </Text>
      )}

      {charges.length > 0 && groups.length === 0 && (
        <Text style={styles.empty}>Δεν βρέθηκε χρέωση για «{query.trim()}».</Text>
      )}

      {groups.map((group) => (
        <View key={group.key} style={styles.monthSection}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthLabel}>{group.label}</Text>
            <Text style={styles.monthTotal}>{formatEuro(group.total)}</Text>
          </View>

          <View style={styles.list}>
            {group.items.map((item, index) => (
              <SubscriptionRow
                key={item.key}
                subscription={item.subscription}
                showDivider={index < group.items.length - 1}
                subtitle={formatChargeDay(item.date)}
                onPress={() => openSubscription(item.subscription.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

type StatProps = { label: string; value: string };

const Stat = ({ label, value }: StatProps) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.semibold,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    gap: 2,
  },
  cardLabel: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium },
  cardNote: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 14 },
  yearPaid: {
    color: colors.text,
    fontSize: 34,
    fontFamily: fonts.semibold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: 12,
    gap: 2,
  },
  statLabel: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
  statValue: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  monthSection: { gap: spacing.sm, marginTop: spacing.xs },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  monthLabel: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
  monthTotal: {
    color: colors.textMuted,
    fontSize: 15,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
});