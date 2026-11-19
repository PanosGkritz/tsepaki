import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { fonts, radius, spacing } from '../constants/theme';
import { daysUntil, formatChargeDay, formatRelativeDays } from '../lib/dates';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { SubscriptionRow } from './SubscriptionRow';

type UpcomingChargesProps = {
  subscriptions: Subscription[];
  limit?: number;
};

const openSubscription = (id: string) =>
  router.push({ pathname: '/subscription/[id]', params: { id } });

export const UpcomingCharges = ({ subscriptions, limit = 4 }: UpcomingChargesProps) => {
  const styles = useStyles();
  const { t, language } = usePreferences();
  const upcoming = [...subscriptions]
    .sort((a, b) => a.nextChargeDate.localeCompare(b.nextChargeDate))
    .slice(0, limit);

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

      {upcoming.length === 0 ? (
        <Text style={styles.empty}>{t('upcoming.empty')}</Text>
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
                    {formatChargeDay(subscription.nextChargeDate, language)}
                    {' · '}
                    <Text style={days <= 2 ? styles.soon : undefined}>
                      {formatRelativeDays(days, language)}
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

const useStyles = createStyles((colors) => ({
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
}));