import { Text, View } from 'react-native';
import { fonts, radius, spacing } from '../constants/theme';
import { formatEuro } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';

type MonthSummaryCardProps = {
  monthLabel: string;
  total: number;
  paid: number;
  subscriptionCount: number;
};

export const MonthSummaryCard = ({
  monthLabel,
  total,
  paid,
  subscriptionCount,
}: MonthSummaryCardProps) => {
  const styles = useStyles();
  const { t, language } = usePreferences();
  const remaining = total - paid;
  const countLabel =
    subscriptionCount === 1
      ? t('summary.countOne')
      : t('summary.count', { count: subscriptionCount });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.month}>{monthLabel}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{countLabel}</Text>
        </View>
      </View>

      <View style={styles.totalBlock}>
        <Text style={styles.total}>{formatEuro(total, language)}</Text>
        <Text style={styles.caption}>{t('summary.caption')}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label={t('summary.paid')} value={formatEuro(paid, language)} />
        <Stat label={t('summary.remaining')} value={formatEuro(remaining, language)} />
      </View>
    </View>
  );
};

type StatProps = { label: string; value: string };

const Stat = ({ label, value }: StatProps) => {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  card: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: 22,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  month: { color: colors.onAccent, opacity: 0.85, fontSize: 14, fontFamily: fonts.medium },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: colors.onAccent, fontSize: 13, fontFamily: fonts.medium },
  totalBlock: { gap: 2 },
  total: {
    color: colors.onAccent,
    fontSize: 40,
    fontFamily: fonts.semibold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  caption: { color: colors.onAccent, opacity: 0.85, fontSize: 14, fontFamily: fonts.regular },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    padding: 12,
    gap: 2,
  },
  statLabel: { color: colors.onAccent, opacity: 0.85, fontSize: 12, fontFamily: fonts.regular },
  statValue: {
    color: colors.onAccent,
    fontSize: 17,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
}));