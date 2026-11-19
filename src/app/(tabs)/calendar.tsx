import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarGrid } from '../../components/CalendarGrid';
import { SubscriptionRow } from '../../components/SubscriptionRow';
import { fonts, radius, spacing } from '../../constants/theme';
import { getChargedItems } from '../../db/charges';
import { getSubscriptions } from '../../db/subscriptions';
import type { Language, Translate } from '../../i18n';
import {
  getMonthEnd,
  getMonthStart,
  getUpcomingItems,
  groupByDate,
  shiftMonth,
  type CalendarItem,
} from '../../lib/calendar';
import { daysUntil, formatFullDate, formatRelativeDays, parseIsoDate, toIsoDate } from '../../lib/dates';
import { formatEuro } from '../../lib/format';
import { syncReminders } from '../../lib/reminders';
import { createStyles } from '../../lib/styles';
import { getMonthLabel } from '../../lib/summary';
import { usePreferences } from '../../providers/PreferencesProvider';

const describeItem = (item: CalendarItem, t: Translate, language: Language) =>
  item.status === 'paid'
    ? t('calendar.paid')
    : t('calendar.willCharge', { when: formatRelativeDays(daysUntil(item.date), language) });

export default function Calendar() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language } = usePreferences();
  const todayIso = toIsoDate(new Date());
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [items, setItems] = useState<CalendarItem[]>([]);

  const monthFrom = toIsoDate(monthStart);
  const monthTo = toIsoDate(getMonthEnd(monthStart));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        await syncReminders(db);
        const [subscriptions, charged] = await Promise.all([
          getSubscriptions(db),
          getChargedItems(db, monthFrom, monthTo),
        ]);

        if (!isActive) return;
        setItems([...charged, ...getUpcomingItems(subscriptions, monthFrom, monthTo)]);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [db, monthFrom, monthTo]),
  );

  const changeMonth = (delta: number) => {
    const next = shiftMonth(monthStart, delta);
    const isCurrentMonth = toIsoDate(next) === toIsoDate(getMonthStart(new Date()));
    setMonthStart(next);
    setSelectedDate(isCurrentMonth ? todayIso : toIsoDate(next));
  };

  const itemsByDate = groupByDate(items);
  const selectedItems = itemsByDate.get(selectedDate) ?? [];
  const monthTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const paidTotal = items
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('calendar.title')}</Text>

      <View style={styles.monthNav}>
        <Pressable
          onPress={() => changeMonth(-1)}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.prevMonth')}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.monthInfo}>
          <Text style={styles.monthLabel}>{getMonthLabel(monthStart, language)}</Text>
          <Text style={styles.monthTotals}>
            {t('calendar.totals', {
              total: formatEuro(monthTotal, language),
              paid: formatEuro(paidTotal, language),
            })}
          </Text>
        </View>

        <Pressable
          onPress={() => changeMonth(1)}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <CalendarGrid
          monthStart={monthStart}
          itemsByDate={itemsByDate}
          selectedDate={selectedDate}
          todayIso={todayIso}
          onSelect={setSelectedDate}
        />
      </View>

      <View style={styles.daySection}>
        <Text style={styles.dayTitle}>{formatFullDate(parseIsoDate(selectedDate), language)}</Text>

        {selectedItems.length === 0 ? (
          <Text style={styles.empty}>{t('calendar.empty')}</Text>
        ) : (
          <View style={styles.list}>
            {selectedItems.map((item, index) => (
              <SubscriptionRow
                key={item.key}
                subscription={item.subscription}
                showDivider={index < selectedItems.length - 1}
                subtitle={describeItem(item, t, language)}
                onPress={() =>
                  router.push({
                    pathname: '/subscription/[id]',
                    params: { id: item.subscription.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthInfo: { flex: 1, alignItems: 'center', gap: 2 },
  monthLabel: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold },
  monthTotals: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingTop: spacing.md,
  },
  daySection: { gap: spacing.sm, marginTop: spacing.xs },
  dayTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
}));