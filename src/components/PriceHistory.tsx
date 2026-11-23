import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fonts, radius, spacing } from '../constants/theme';
import { getPriceHistory, percentChange, type PriceChange } from '../db/priceChanges';
import { parseIsoDate } from '../lib/dates';
import { formatMoney } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';

type PriceHistoryProps = { subscription: Subscription };

// «23/11/2026»: χωρίς μέρα της εβδομάδας, για να χωράει στη γραμμή.
const formatDay = (iso: string) => {
  const date = parseIsoDate(iso);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Pro: πώς άλλαξε η τιμή μιας συνδρομής. Χωρίς Pro, μια γραμμή που ανοίγει το Pro.
export const PriceHistory = ({ subscription }: PriceHistoryProps) => {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language, hideAmounts, isPro } = usePreferences();
  const [changes, setChanges] = useState<PriceChange[] | null>(null);

  useEffect(() => {
    if (isPro) getPriceHistory(db, subscription.id).then(setChanges);
  }, [db, isPro, subscription.id]);

  if (!isPro) {
    return (
      <Pressable
        onPress={() => router.push('/pro')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.teaser, pressed && styles.pressed]}
      >
        <Ionicons name="trending-up-outline" size={18} color={colors.textMuted} />
        <Text style={styles.teaserText}>{t('priceHistory.teaser')}</Text>
        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
      </Pressable>
    );
  }

  if (!changes) return null;

  const money = (amount: number) => formatMoney(amount, language, hideAmounts);
  const since = subscription.createdAt ? formatDay(subscription.createdAt) : null;
  const startPrice = changes[0]?.oldPrice ?? subscription.price;
  const totalPercent = percentChange(startPrice, subscription.price);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('priceHistory.title')}</Text>
        {changes.length > 0 && totalPercent !== 0 && (
          <Text style={[styles.total, totalPercent > 0 ? styles.up : styles.down]}>
            {`${totalPercent > 0 ? '+' : ''}${totalPercent}%`}
          </Text>
        )}
      </View>

      {changes.length === 0 ? (
        <Text style={styles.empty}>
          {since
            ? t('priceHistory.unchangedSince', { date: since })
            : t('priceHistory.unchanged')}
        </Text>
      ) : (
        <View style={styles.list}>
          {since && (
            <View style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.date}>{since}</Text>
              <Text style={styles.price}>{money(startPrice)}</Text>
            </View>
          )}
          {changes.map((change) => {
            const percent = percentChange(change.oldPrice, change.newPrice);
            return (
              <View key={change.id} style={styles.row}>
                <View style={[styles.dot, percent > 0 ? styles.dotUp : styles.dotDown]} />
                <Text style={styles.date}>
                  {formatDay(change.changedOn)}
                </Text>
                <Text style={[styles.change, percent > 0 ? styles.up : styles.down]}>
                  {`${percent > 0 ? '+' : ''}${percent}%`}
                </Text>
                <Text style={styles.price}>{money(change.newPrice)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  total: { fontSize: 13, fontFamily: fonts.semibold },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotUp: { backgroundColor: colors.warning },
  dotDown: { backgroundColor: colors.accentBright },
  date: { flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.regular },
  change: { fontSize: 13, fontFamily: fonts.medium },
  up: { color: colors.warning },
  down: { color: colors.accentBright },
  price: {
    minWidth: 72,
    textAlign: 'right',
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  teaserText: { flex: 1, color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
  pressed: { opacity: 0.7 },
}));
