import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { CATALOG_CURRENCY } from '../lib/currency';
import { formatMoney } from '../lib/format';
import { getSavingTips, type SavingTip, type TipKind } from '../lib/savings';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { ProBadge } from './ProCard';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<TipKind, IconName> = {
  trial: 'hourglass-outline',
  bundle: 'albums-outline',
  overlap: 'layers-outline',
  yearly: 'calendar-outline',
  cheaperPlan: 'pricetag-outline',
};

type SavingsTipsProps = {
  subscriptions: Subscription[];
  dismissed: string[];
  onDismiss: (id: string) => void;
};

const openSubscription = (id: string) =>
  router.push({ pathname: '/subscription/[id]', params: { id } });

// «Γλίτωσέ τα» στην αρχική: μία πρόταση ανά κάρτα, με τελείες όπως οι επόμενες χρεώσεις.
// Χωρίς Pro φαίνεται μόνο το προσωπικό νούμερο, που ανοίγει το Pro. Κρύβεται αν δεν υπάρχει πρόταση.
export const SavingsTips = ({ subscriptions, dismissed, onDismiss }: SavingsTipsProps) => {
  const styles = useStyles();
  const { colors, t, language, hideAmounts, isPro, currency } = usePreferences();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const money = (amount: number) => formatMoney(amount, language, hideAmounts);

  const { tips, yearlyTotal } = getSavingTips(subscriptions, {
    money,
    usesCatalogPrices: currency === CATALOG_CURRENCY,
    dismissed,
  });

  if (tips.length === 0) return null;

  if (!isPro) {
    return (
      <Animated.View entering={FadeInDown.duration(320)}>
        <Pressable
          onPress={() => router.push('/pro')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.teaser, pressed && styles.pressed]}
        >
          <View style={styles.teaserTop}>
            <Text style={styles.title}>{t('tips.title')}</Text>
            <ProBadge id="tipsTeaserBadge" />
          </View>
          <Text style={styles.teaserText}>
            {t('tips.teaser', {
              monthly: money(yearlyTotal / 12),
              yearly: money(yearlyTotal),
            })}
          </Text>
          <View style={styles.teaserLink}>
            <Text style={styles.link}>{t('tips.teaserAction')}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.accentBright} />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  const current = Math.min(page, tips.length - 1);

  const renderTip = (tip: SavingTip) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.icon}>
          <Ionicons name={ICONS[tip.kind]} size={20} color={colors.accentBright} />
        </View>
        <Text style={styles.tipTitle}>{t(tip.titleKey, tip.params)}</Text>
        <Pressable
          onPress={() => onDismiss(tip.id)}
          accessibilityRole="button"
          accessibilityLabel={t('tips.dismiss')}
          hitSlop={10}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.tipBody}>{t(tip.bodyKey, tip.params)}</Text>
      <View style={styles.cardBottom}>
        <Pressable
          onPress={() => openSubscription(tip.subscriptionId)}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.link}>{t('tips.open')}</Text>
        </Pressable>
        <Pressable onPress={() => onDismiss(tip.id)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.muted}>{t('tips.dismiss')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      layout={LinearTransition.duration(240)}
      style={styles.section}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('tips.title')}</Text>
        <Animated.Text
          key={yearlyTotal}
          entering={FadeIn.duration(200)}
          style={styles.total}
        >
          {t('tips.upTo', { amount: money(yearlyTotal) })}
        </Animated.Text>
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pages}
            onMomentumScrollEnd={(event) =>
              setPage(Math.round(event.nativeEvent.contentOffset.x / width))
            }
          >
            {tips.map((tip) => (
              <Animated.View
                key={tip.id}
                exiting={FadeOut.duration(180)}
                layout={LinearTransition.duration(240)}
                style={{ width }}
              >
                {renderTip(tip)}
              </Animated.View>
            ))}
          </ScrollView>
        )}

        {tips.length > 1 && (
          <View style={styles.dots}>
            {tips.map((tip, index) => (
              <View key={tip.id} style={[styles.dot, index === current && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const useStyles = createStyles((colors) => ({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold },
  total: { color: colors.accentBright, fontSize: 15, fontFamily: fonts.medium },
  pages: { alignItems: 'flex-start' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { flex: 1, color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
  tipBody: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  link: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.semibold },
  muted: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium },
  dots: { flexDirection: 'row', gap: 6, marginTop: spacing.sm, paddingHorizontal: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.accentBright },
  teaser: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 10,
  },
  teaserTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teaserText: { color: colors.text, fontSize: 15, fontFamily: fonts.regular, lineHeight: 22 },
  teaserLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pressed: { opacity: 0.8 },
}));
