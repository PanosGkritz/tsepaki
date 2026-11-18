import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { daysUntil, formatChargeDay, formatRelativeDays } from '../lib/dates';
import { formatEuro } from '../lib/format';
import type { Subscription } from '../types/subscription';
import { ServiceLogo } from './ServiceLogo';

type UpcomingChargesProps = {
  subscriptions: Subscription[];
  limit?: number;
};

export const UpcomingCharges = ({ subscriptions, limit = 4 }: UpcomingChargesProps) => {
  const upcoming = [...subscriptions]
    .sort((a, b) => a.nextChargeDate.localeCompare(b.nextChargeDate))
    .slice(0, limit);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Επόμενες χρεώσεις</Text>

      <View style={styles.list}>
        {upcoming.map((subscription, index) => (
          <ChargeRow
            key={subscription.id}
            subscription={subscription}
            showDivider={index < upcoming.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

type ChargeRowProps = {
  subscription: Subscription;
  showDivider: boolean;
};

const ChargeRow = ({ subscription, showDivider }: ChargeRowProps) => {
  const days = daysUntil(subscription.nextChargeDate);
  const isSoon = days <= 2;

  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <ServiceLogo
        id={subscription.id}
        name={subscription.name}
        fallbackColor={subscription.color}
        size={42}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{subscription.name}</Text>
        <Text style={styles.when}>
          {formatChargeDay(subscription.nextChargeDate)}
          {' · '}
          <Text style={isSoon ? styles.soon : undefined}>{formatRelativeDays(days)}</Text>
        </Text>
      </View>

      <Text style={styles.price}>{formatEuro(subscription.price)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  when: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  soon: { color: colors.warning, fontFamily: fonts.medium },
  price: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
});