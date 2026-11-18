import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { daysUntil, formatChargeDay, formatRelativeDays } from '../lib/dates';
import type { Subscription } from '../types/subscription';
import { SubscriptionRow } from './SubscriptionRow';

type UpcomingChargesProps = {
  subscriptions: Subscription[];
  limit?: number;
};

const openSubscription = (id: string) =>
  router.push({ pathname: '/subscription/[id]', params: { id } });

export const UpcomingCharges = ({ subscriptions, limit = 4 }: UpcomingChargesProps) => {
  const upcoming = [...subscriptions]
    .sort((a, b) => a.nextChargeDate.localeCompare(b.nextChargeDate))
    .slice(0, limit);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Επόμενες χρεώσεις</Text>
        <Pressable
          onPress={() => router.push('/subscriptions')}
          accessibilityRole="link"
          hitSlop={12}
        >
          <Text style={styles.link}>Όλες</Text>
        </Pressable>
      </View>

      {upcoming.length === 0 ? (
        <Text style={styles.empty}>Δεν έχεις ακόμα συνδρομές. Πάτα το + για να προσθέσεις.</Text>
      ) : (
        <View style={styles.list}>
          {upcoming.map((subscription, index) => {
            const days = daysUntil(subscription.nextChargeDate);
            return (
              <SubscriptionRow
                key={subscription.id}
                subscription={subscription}
                showDivider={index < upcoming.length - 1}
                onPress={() => openSubscription(subscription.id)}
                subtitle={
                  <>
                    {formatChargeDay(subscription.nextChargeDate)}
                    {' · '}
                    <Text style={days <= 2 ? styles.soon : undefined}>
                      {formatRelativeDays(days)}
                    </Text>
                  </>
                }
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold },
  link: { color: colors.accentBright, fontSize: 15, fontFamily: fonts.medium },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  soon: { color: colors.warning, fontFamily: fonts.medium },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
});