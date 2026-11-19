import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fonts } from '../constants/theme';
import type { Language, Translate } from '../i18n';
import { formatEuro, formatMoney } from '../lib/format';
import { getMonthName, toAccusative, type MonthTotal } from '../lib/stats';
import { createStyles } from '../lib/styles';
import { getMonthLabel } from '../lib/summary';
import { usePreferences } from '../providers/PreferencesProvider';

const BAR_MAX_HEIGHT = 110;

const describeChange = (
  current: MonthTotal,
  previous: MonthTotal | undefined,
  t: Translate,
  language: Language,
) => {
  if (!previous || previous.total === 0) return null;

  const diff = current.total - previous.total;
  const name = getMonthName(previous.date, language);
  const month = language === 'el' ? toAccusative(name) : name;

  if (Math.abs(diff) < 0.005) return t('bars.same', { month });
  const sign = diff > 0 ? '+' : '−';
  return t('bars.change', { change: `${sign}${formatEuro(Math.abs(diff), language)}`, month });
};

type MonthlyBarsProps = { months: MonthTotal[] };

export const MonthlyBars = ({ months }: MonthlyBarsProps) => {
  const styles = useStyles();
  const { t, language, hideAmounts } = usePreferences();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const foundIndex = months.findIndex((month) => month.key === selectedKey);
  const selectedIndex = foundIndex >= 0 ? foundIndex : months.length - 1;
  const selected = months[selectedIndex];
  if (!selected) return null;

  const maxTotal = Math.max(0, ...months.map((month) => month.total));
  const change = hideAmounts
    ? null
    : describeChange(selected, months[selectedIndex - 1], t, language);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {getMonthLabel(selected.date, language)}
          {selected.isCurrent ? t('bars.withRemaining') : ''}
        </Text>
        <Text style={styles.total}>{formatMoney(selected.total, language, hideAmounts)}</Text>
        {change && <Text style={styles.change}>{change}</Text>}
      </View>

      <View style={styles.bars}>
        {months.map((month, index) => {
          const isSelected = index === selectedIndex;
          const height =
            maxTotal > 0 && month.total > 0
              ? Math.max(6, (month.total / maxTotal) * BAR_MAX_HEIGHT)
              : 4;

          return (
            <Pressable
              key={month.key}
              onPress={() => setSelectedKey(month.key)}
              accessibilityRole="button"
              accessibilityLabel={
                hideAmounts
                  ? getMonthLabel(month.date, language)
                  : `${getMonthLabel(month.date, language)}: ${formatEuro(month.total, language)}`
              }
              accessibilityState={{ selected: isSelected }}
              style={styles.column}
            >
              <View style={styles.track}>
                <View style={[styles.bar, { height }, isSelected && styles.barSelected]} />
              </View>
              <Text style={[styles.barLabel, isSelected && styles.barLabelSelected]}>
                {month.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  wrapper: { gap: 18 },
  header: { gap: 2 },
  label: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  total: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.semibold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  change: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  bars: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center', gap: 8 },
  track: { height: BAR_MAX_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '56%', borderRadius: 8, backgroundColor: colors.surfaceRaised },
  barSelected: { backgroundColor: colors.accentBright },
  barLabel: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
  barLabelSelected: { color: colors.text, fontFamily: fonts.medium },
}));