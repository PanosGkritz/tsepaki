import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
      <SubscriptionRow
        key={subscription.id}
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
        <Text style={styles.empty}>{t('upcoming.empty')}</Text>
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
                  <View style={styles.list}>
                    {items.map((subscription, index) =>
                      renderRow(subscription, index, items.length),
                    )}
                  </View>
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
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
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