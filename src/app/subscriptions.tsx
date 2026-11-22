import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SubscriptionRow } from '../components/SubscriptionRow';
import { fonts, radius, spacing } from '../constants/theme';
import { cancelSubscription, deleteSubscription, getSubscriptions } from '../db/subscriptions';
import type { StringKey } from '../i18n';
import { getCostTotals } from '../lib/costs';
import { formatChargeDay } from '../lib/dates';
import { notifyDataChanged } from '../lib/events';
import { formatEuro } from '../lib/format';
import { hapticRemove } from '../lib/haptics';
import { syncReminders } from '../lib/reminders';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { BillingCycle, Subscription } from '../types/subscription';

const CYCLE_KEYS: Record<BillingCycle, StringKey> = {
  monthly: 'form.monthly',
  yearly: 'form.yearly',
};

const ACTION_WIDTH = 88;
const LIST_TRANSITION = LinearTransition.duration(220);

export default function Subscriptions() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language } = usePreferences();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const load = useCallback(() => {
    getSubscriptions(db).then(setSubscriptions);
  }, [db]);

  useFocusEffect(load);

  const remove = async (action: () => Promise<void>) => {
    await action();
    hapticRemove();
    await syncReminders(db);
    notifyDataChanged();
    load();
  };

  const confirmCancel = (subscription: Subscription, swipeable: SwipeableMethods) =>
    Alert.alert(t('edit.cancelTitle'), t('edit.cancelMessage'), [
      { text: t('edit.cancelNo'), style: 'cancel', onPress: swipeable.close },
      {
        text: t('edit.cancelYes'),
        onPress: () => remove(() => cancelSubscription(db, subscription.id)),
      },
    ]);

  const confirmDelete = (subscription: Subscription, swipeable: SwipeableMethods) =>
    Alert.alert(t('edit.deleteTitle'), t('edit.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel', onPress: swipeable.close },
      {
        text: t('edit.delete'),
        style: 'destructive',
        onPress: () => remove(() => deleteSubscription(db, subscription.id)),
      },
    ]);

  const totals = getCostTotals(subscriptions);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('list.back')}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>{t('list.title')}</Text>

      <View style={styles.totals}>
        <Total label={t('list.monthly')} value={formatEuro(totals.monthly, language)} />
        <Total label={t('list.yearly')} value={formatEuro(totals.yearly, language)} />
      </View>

      {subscriptions.length === 0 ? (
        <Text style={styles.empty}>{t('upcoming.empty')}</Text>
      ) : (
        <Animated.View style={styles.list} layout={LIST_TRANSITION}>
          {subscriptions.map((subscription, index) => (
            <Animated.View
              key={subscription.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(180)}
              layout={LIST_TRANSITION}
            >
              <ReanimatedSwipeable
                friction={2}
                rightThreshold={ACTION_WIDTH / 2}
                overshootRight={false}
                containerStyle={styles.swipeable}
                renderRightActions={(_progress, _translation, swipeable) => (
                  <View style={styles.actions}>
                    <SwipeAction
                      icon="close-circle-outline"
                      label={t('list.cancelAction')}
                      onPress={() => confirmCancel(subscription, swipeable)}
                    />
                    <SwipeAction
                      icon="trash-outline"
                      label={t('edit.delete')}
                      isDestructive
                      onPress={() => confirmDelete(subscription, swipeable)}
                    />
                  </View>
                )}
              >
                <View style={styles.rowWrap}>
                  <SubscriptionRow
                    subscription={subscription}
                    showDivider={index < subscriptions.length - 1}
                    onPress={() =>
                      router.push({
                        pathname: '/subscription/[id]',
                        params: { id: subscription.id },
                      })
                    }
                    subtitle={t('list.subtitle', {
                      cycle: t(CYCLE_KEYS[subscription.cycle]),
                      day: formatChargeDay(subscription.nextChargeDate, language),
                    })}
                  />
                </View>
              </ReanimatedSwipeable>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {subscriptions.length > 0 && <Text style={styles.note}>{t('list.swipeHint')}</Text>}
      <Text style={styles.note}>{t('list.note')}</Text>
    </ScrollView>
  );
}

type SwipeActionProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
};

const SwipeAction = ({ icon, label, onPress, isDestructive = false }: SwipeActionProps) => {
  const styles = useStyles();
  const { colors } = usePreferences();
  const color = isDestructive ? colors.warning : colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

type TotalProps = { label: string; value: string };

const Total = ({ label, value }: TotalProps) => {
  const styles = useStyles();
  return (
    <View style={styles.total}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  totals: { flexDirection: 'row', gap: spacing.sm },
  total: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  totalLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  totalValue: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  swipeable: { backgroundColor: colors.surfaceRaised },
  rowWrap: { backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  actions: { flexDirection: 'row', width: ACTION_WIDTH * 2 },
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionPressed: { opacity: 0.6 },
  actionText: { fontSize: 12, fontFamily: fonts.medium },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
  note: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
}));