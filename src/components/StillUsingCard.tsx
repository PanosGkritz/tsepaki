import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { formatMoney } from '../lib/format';
import { getMyCost } from '../lib/share';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { PoofOut } from './PoofOut';
import { ServiceLogo } from './ServiceLogo';

type StillUsingCardProps = {
  subscription: Subscription;
  lastMonthsCost: number;
  removing: boolean;
  onKeep: () => void;
  onCancel: () => void;
};

// «Το χρησιμοποιείς ακόμα;»: μία κάρτα στην αρχική για μια συνδρομή που έχεις καιρό.
export const StillUsingCard = ({
  subscription,
  lastMonthsCost,
  removing,
  onKeep,
  onCancel,
}: StillUsingCardProps) => {
  const styles = useStyles();
  const { colors, t, language, hideAmounts } = usePreferences();
  const money = (amount: number) => formatMoney(amount, language, hideAmounts);
  const price = money(getMyCost(subscription));

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
                {`${subscription.name} · ${t(
                  subscription.cycle === 'yearly' ? 'review.perYear' : 'review.perMonth',
                  { amount: price },
                )}`}
              </Text>
              <Text style={styles.question}>{t('review.question')}</Text>
            </View>
          </View>

          {lastMonthsCost > 0 && (
            <Text style={styles.cost}>{t('review.cost', { amount: money(lastMonthsCost) })}</Text>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={onKeep}
              disabled={removing}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.keep, pressed && styles.pressed]}
            >
              <Text style={styles.keepText}>{t('review.keep')}</Text>
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
  info: { flex: 1, gap: 2 },
  name: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  question: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold },
  cost: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
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
}));
