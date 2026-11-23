import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { percentChange, type PriceChange } from '../db/priceChanges';
import { formatMoney } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { PoofOut } from './PoofOut';
import { ServiceLogo } from './ServiceLogo';

type PriceIncreaseCardProps = {
  subscription: Subscription;
  change: PriceChange;
  removing: boolean;
  onKeep: () => void;
  onCancel: () => void;
  onNotChanged: () => void;
};

// Pro: ανέβηκε η τιμή μιας συνδρομής στον κατάλογο. Ρωτάμε αν την κρατάει με τη νέα τιμή.
export const PriceIncreaseCard = ({
  subscription,
  change,
  removing,
  onKeep,
  onCancel,
  onNotChanged,
}: PriceIncreaseCardProps) => {
  const styles = useStyles();
  const { colors, t, language, hideAmounts } = usePreferences();
  const money = (amount: number) => formatMoney(amount, language, hideAmounts);
  const percent = percentChange(change.oldPrice, change.newPrice);

  return (
    <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOutUp.duration(220)}>
      <PoofOut active={removing} color={colors.neutral}>
        <View style={styles.card}>
          <View style={styles.top}>
            <ServiceLogo
              id={subscription.serviceId ?? subscription.id}
              name={subscription.name}
              fallbackColor={subscription.color}
              domain={subscription.serviceId ? undefined : subscription.domain}
              size={44}
            />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {t('priceUp.title', { name: subscription.name })}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.oldPrice}>{money(change.oldPrice)}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                <Text style={styles.newPrice}>{money(change.newPrice)}</Text>
                {percent > 0 && (
                  <View style={styles.percent}>
                    <Text style={styles.percentText}>{`+${percent}%`}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.question}>
            {t(subscription.cycle === 'yearly' ? 'priceUp.questionYearly' : 'priceUp.question')}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onKeep}
              disabled={removing}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.keep, pressed && styles.pressed]}
            >
              <Text style={styles.keepText}>{t('priceUp.keep')}</Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              disabled={removing}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{t('review.cancel')}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onNotChanged}
            disabled={removing}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.linkButton}
          >
            <Text style={styles.link}>{t('priceUp.notChanged')}</Text>
          </Pressable>
        </View>
      </PoofOut>
    </Animated.View>
  );
};

const useStyles = createStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 4 },
  name: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  oldPrice: {
    color: colors.textMuted,
    fontSize: 16,
    fontFamily: fonts.regular,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  newPrice: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  percent: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.surfaceRaised,
  },
  percentText: { color: colors.warning, fontSize: 12, fontFamily: fonts.semibold },
  question: { color: colors.text, fontSize: 15, fontFamily: fonts.medium, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keep: { backgroundColor: colors.accent },
  cancel: { backgroundColor: colors.surfaceRaised },
  pressed: { opacity: 0.75 },
  keepText: { color: colors.onAccent, fontSize: 14, fontFamily: fonts.semibold },
  cancelText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  linkButton: { alignSelf: 'center' },
  link: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
}));
