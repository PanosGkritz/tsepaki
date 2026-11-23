import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { getRecentChargeDates } from '../db/charges';
import { getSharePayments, setSharePaid } from '../db/sharePayments';
import { formatChargeDay } from '../lib/dates';
import { formatMoney } from '../lib/format';
import { hapticSuccess } from '../lib/haptics';
import { getAvatarColor, getInitials, getShareBreakdown } from '../lib/share';
import { buildShareMessage } from '../lib/shareMessage';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { POOF_DURATION, PoofOut } from './PoofOut';

const ALL_PAID_SHOWN_MS = 1600;

type SharePaymentsProps = { subscription: Subscription };

// Για κοινές που πληρώνεις εσύ: σε κάθε χρέωση σημειώνεις ποιος σού έδωσε το μερίδιό του.
export const SharePayments = ({ subscription }: SharePaymentsProps) => {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { t, language, hideAmounts } = usePreferences();
  const [dates, setDates] = useState<string[]>([]);
  const [paid, setPaid] = useState<Map<string, Set<string>>>(new Map());
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [loadedDates, loadedPaid] = await Promise.all([
      getRecentChargeDates(db, subscription.id),
      getSharePayments(db, subscription.id),
    ]);
    setDates(loadedDates);
    setPaid(loadedPaid);
  }, [db, subscription.id]);

  useEffect(() => {
    load();
  }, [load]);

  const share = subscription.share;
  if (!share || share.payer) return null;

  const { others } = getShareBreakdown(subscription.price, share);

  const toggle = async (chargeDate: string, person: string) => {
    const people = new Set(paid.get(chargeDate) ?? []);
    const isPaid = !people.has(person);
    if (isPaid) people.add(person);
    else people.delete(person);

    setPaid(new Map(paid).set(chargeDate, people));
    await setSharePaid(db, subscription.id, chargeDate, person, isPaid);

    // Μία δόνηση μόνο, όταν πληρώσει και ο τελευταίος.
    if (isPaid && others.every((other) => people.has(other.name))) {
      hapticSuccess();
      setCelebrating(chargeDate);
      setTimeout(() => setCelebrating(null), ALL_PAID_SHOWN_MS);
    }
  };

  const askForShares = () => Share.share({ message: buildShareMessage(subscription, language) });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('share.paymentsTitle')}</Text>
        {dates.length > 0 && <Text style={styles.empty}>{t('share.paymentsHint')}</Text>}
      </View>

      {dates.length === 0 && <Text style={styles.empty}>{t('share.paymentsEmpty')}</Text>}

      {dates.map((chargeDate) => {
        const people = paid.get(chargeDate) ?? new Set<string>();
        const isCelebrating = celebrating === chargeDate;

        return (
          <View key={chargeDate} style={styles.charge}>
            <Text style={styles.chargeDay}>
              {t('share.chargeOn', { day: formatChargeDay(chargeDate, language) })}
            </Text>

            <PoofOut active={isCelebrating} color="#4CC38A">
              <View style={styles.people}>
                {others.map((person) => (
                  <PersonToggle
                    key={person.name}
                    name={person.name}
                    amount={formatMoney(person.amount, language, hideAmounts)}
                    isPaid={people.has(person.name)}
                    onPress={() => toggle(chargeDate, person.name)}
                    label={t('share.paidLabel', { name: person.name })}
                  />
                ))}
              </View>
            </PoofOut>

            {isCelebrating && (
              <Animated.View
                entering={ZoomIn.delay(POOF_DURATION / 2).springify().damping(12)}
                exiting={FadeOut.duration(200)}
                style={styles.allPaid}
              >
                <Ionicons name="checkmark-circle" size={18} color="#4CC38A" />
                <Text style={styles.allPaidText}>{t('share.allPaid')}</Text>
              </Animated.View>
            )}
          </View>
        );
      })}

      <Pressable
        onPress={askForShares}
        accessibilityRole="button"
        style={({ pressed }) => [styles.askButton, pressed && styles.pressed]}
      >
        <Ionicons name="paper-plane-outline" size={18} color={styles.askText.color} />
        <Text style={styles.askText}>{t('share.ask')}</Text>
      </Pressable>
    </View>
  );
};

type PersonToggleProps = {
  name: string;
  amount: string;
  isPaid: boolean;
  label: string;
  onPress: () => void;
};

const GREEN = '#2F9E6B';

// Ο κύκλος γεμίζει πράσινος και εμφανίζεται το τικ όταν σημειώσεις ότι πλήρωσε.
const PersonToggle = ({ name, amount, isPaid, label, onPress }: PersonToggleProps) => {
  const styles = useStyles();
  const { colors } = usePreferences();
  const progress = useSharedValue(isPaid ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isPaid ? 1 : 0, { duration: 240 });
    if (isPaid) {
      scale.value = 0.85;
      scale.value = withSpring(1, { damping: 10, stiffness: 260 });
    }
  }, [isPaid, progress, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [getAvatarColor(name), GREEN]),
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isPaid }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.person, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.circle, circleStyle]}>
        {isPaid ? (
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </Animated.View>
        ) : (
          <Animated.Text entering={FadeIn.duration(150)} style={styles.initials}>
            {getInitials(name)}
          </Animated.Text>
        )}
      </Animated.View>
      <Text style={styles.personName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.personAmount, isPaid && { color: colors.accentBright }]}>{amount}</Text>
    </Pressable>
  );
};

const useStyles = createStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: spacing.md,
  },
  header: { gap: 2 },
  title: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  charge: { gap: spacing.sm },
  chargeDay: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  person: { alignItems: 'center', gap: 4, width: 72 },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.semibold },
  personName: { color: colors.text, fontSize: 12, fontFamily: fonts.medium },
  personAmount: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    fontVariant: ['tabular-nums'],
  },
  allPaid: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  allPaidText: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.semibold },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  askText: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.semibold },
  pressed: { opacity: 0.7 },
}));
