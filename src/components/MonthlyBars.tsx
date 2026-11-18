import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { formatEuro } from '../lib/format';
import { getMonthName, toAccusative, type MonthTotal } from '../lib/stats';
import { getMonthLabel } from '../lib/summary';

const BAR_MAX_HEIGHT = 110;

const describeChange = (current: MonthTotal, previous?: MonthTotal) => {
  if (!previous || previous.total === 0) return null;

  const diff = current.total - previous.total;
  const monthName = toAccusative(getMonthName(previous.date));

  if (Math.abs(diff) < 0.005) return `Ίδιο με τον ${monthName}`;
  const sign = diff > 0 ? '+' : '−';
  return `${sign}${formatEuro(Math.abs(diff))} σε σχέση με τον ${monthName}`;
};

type MonthlyBarsProps = { months: MonthTotal[] };

export const MonthlyBars = ({ months }: MonthlyBarsProps) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const foundIndex = months.findIndex((month) => month.key === selectedKey);
  const selectedIndex = foundIndex >= 0 ? foundIndex : months.length - 1;
  const selected = months[selectedIndex];
  if (!selected) return null;

  const maxTotal = Math.max(0, ...months.map((month) => month.total));
  const change = describeChange(selected, months[selectedIndex - 1]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {getMonthLabel(selected.date)}
          {selected.isCurrent ? ' · μαζί με όσα απομένουν' : ''}
        </Text>
        <Text style={styles.total}>{formatEuro(selected.total)}</Text>
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
              accessibilityLabel={`${getMonthLabel(month.date)}: ${formatEuro(month.total)}`}
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

const styles = StyleSheet.create({
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
});