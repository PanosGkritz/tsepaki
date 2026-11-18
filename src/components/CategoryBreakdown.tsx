import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../constants/theme';
import { formatEuro } from '../lib/format';
import type { CategoryShare } from '../lib/stats';

type CategoryBreakdownProps = { items: CategoryShare[] };

export const CategoryBreakdown = ({ items }: CategoryBreakdownProps) => (
  <View style={styles.wrapper}>
    <View style={styles.track}>
      {items.map((item) => (
        <View key={item.category} style={{ flex: item.share, backgroundColor: item.color }} />
      ))}
    </View>

    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.category} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.name}>{item.category}</Text>
          <Text style={styles.amount}>{formatEuro(item.amount)}</Text>
          <Text style={styles.share}>{Math.round(item.share * 100)}%</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { gap: 16 },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.full,
    overflow: 'hidden',
    gap: 2,
  },
  legend: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  name: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  amount: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  share: {
    width: 44,
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
    fontVariant: ['tabular-nums'],
  },
});