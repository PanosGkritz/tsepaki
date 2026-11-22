import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { daysUntil, formatChargeDay, formatRelativeDays } from '../lib/dates';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { SubscriptionRow } from './SubscriptionRow';

type UpcomingChargesProps = {
  subscriptions: Subscription[];
  onMarkPaid: (subscription: Subscription) => void;
  pageSize?: number;
};

const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

// Ήπια κίνηση όταν μπαίνει, φεύγει ή αλλάζει θέση μια συνδρομή. Σέβεται τη «Μείωση κίνησης» του κινητού.
const ROW_ENTERING = FadeIn.duration(220);
const ROW_EXITING = FadeOut.duration(160);
const ROW_LAYOUT = LinearTransition.duration(240);

const openSubscription = (id: string) =>
  router.push({ pathname: '/subscription/[id]', params: { id } });

export const UpcomingCharges = ({
  subscriptions,
  onMarkPaid,
  pageSize = 4,
}: UpcomingChargesProps) => {
  const styles = useStyles();
  const { colors, t, language, hideAmounts } = usePreferences();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  const sorted = [...subscriptions].sort((a, b) =>
    a.nextChargeDate.localeCompare(b.nextChargeDate),
  );
  const pages = chunk(sorted, pageSize);
  const isLastPage = page >= pages.length - 1;

  const renderRow = (subscription: Subscription, index: number, count: number) => {
    const days = daysUntil(subscription.nextChargeDate);
    const isManual = subscription.paymentMode === 'manual';
    const isOverdue = isManual && days < 0;
    const canMarkPaid = isManual && days <= 0;

    return (
      <Animated.View
        key={subscription.id}
        entering={ROW_ENTERING}
        exiting={ROW_EXITING}
        layout={ROW_LAYOUT}
      >
        <SubscriptionRow
          subscription={subscription}
          showDivider={index < count - 1}
          hideAmount={hideAmounts}
          onPress={() => openSubscription(subscription.id)}
          subtitle={
            <>
              {formatChargeDay(subscription.nextChargeDate, language)}
              {' · '}
              <Text style={days <= 2 ? styles.soon : undefined}>
                {isOverdue ? t('upcoming.overdue') : formatRelativeDays(Math.max(days, 0), language)}
              </Text>
            </>
          }
          action={
            canMarkPaid ? (
              <Pressable
                onPress={() => onMarkPaid(subscription)}
                accessibilityRole="button"
                accessibilityLabel={t('upcoming.markPaidLabel', { name: subscription.name })}
                hitSlop={8}
                style={({ pressed }) => [styles.paidButton, pressed && styles.pressed]}
              >
                <Ionicons name="checkmark" size={14} color={colors.onAccent} />
                <Text style={styles.paidText}>{t('upcoming.markPaid')}</Text>
              </Pressable>
            ) : undefined
          }
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('upcoming.title')}</Text>
        <Pressable
          onPress={() => router.push('/subscriptions')}
          accessibilityRole="link"
          hitSlop={12}
        >
          <Text style={styles.link}>{t('upcoming.all')}</Text>
        </Pressable>
      </View>

      {pages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>{t('upcoming.empty')}</Text>
          <Pressable
            onPress={() => router.navigate('/add')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={18} color={colors.onAccent} />
            <Text style={styles.emptyButtonText}>{t('upcoming.emptyAction')}</Text>
          </Pressable>
        </View>
      ) : (
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {width > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pages}
              onMomentumScrollEnd={(event) =>
                setPage(Math.round(event.nativeEvent.contentOffset.x / width))
              }
            >
              {pages.map((items, pageIndex) => (
                <View key={pageIndex} style={{ width }}>
                  <Animated.View style={styles.list} layout={ROW_LAYOUT}>
                    {items.map((subscription, index) =>
                      renderRow(subscription, index, items.length),
                    )}
                  </Animated.View>
                </View>
              ))}
            </ScrollView>
          )}

          {pages.length > 1 && (
            <View style={styles.pager}>
              <View style={styles.dots}>
                {pages.map((_, index) => (
                  <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
                ))}
              </View>
              {!isLastPage && <Text style={styles.hint}>{t('upcoming.swipe')}</Text>}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold },
  link: { color: colors.accentBright, fontSize: 15, fontFamily: fonts.medium },
  pages: { alignItems: 'flex-start' },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  soon: { color: colors.warning, fontFamily: fonts.medium },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  emptyButtonText: { color: colors.onAccent, fontSize: 14, fontFamily: fonts.medium },
  paidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  paidText: { color: colors.onAccent, fontSize: 12, fontFamily: fonts.semibold },
  pressed: { opacity: 0.7 },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.accentBright },
  hint: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
}));