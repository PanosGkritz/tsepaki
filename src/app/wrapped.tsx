import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { AppLogo } from '../components/AppLogo';
import { ServiceLogo } from '../components/ServiceLogo';
import { fonts, radius, spacing } from '../constants/theme';
import { getCategoryLabel } from '../data/categories';
import { getChargedItems } from '../db/charges';
import { getCancelledSince, getSubscriptions } from '../db/subscriptions';
import { toIsoDate } from '../lib/dates';
import { formatMoney } from '../lib/format';
import { hapticSuccess } from '../lib/haptics';
import { CATEGORY_COLORS, getMonthName } from '../lib/stats';
import { getWrappedStats, type WrappedStats } from '../lib/wrapped';
import { usePreferences } from '../providers/PreferencesProvider';

const WHITE = '#FFFFFF';
const SOFT = 'rgba(255,255,255,0.72)';

// Κάθε διαφάνεια έχει το δικό της χρώμα, από το πράσινο του Τσεπακιού ως την ίριδα του Pro.
const BACKGROUNDS: [string, string][] = [
  ['#1F6F54', '#0B2E22'],
  ['#5B21B6', '#1E1033'],
  ['#0F766E', '#0A2523'],
  ['#9D174D', '#2A0F1C'],
  ['#1D4ED8', '#0C1A3D'],
  ['#B45309', '#2B1907'],
  ['#7C3AED', '#14101F'],
];

const COUNT_DURATION = 900;

// Ο αριθμός «τρέχει» από το 0 ως την τελική τιμή.
const CountUp = ({ value, format }: { value: number; format: (value: number) => string }) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / COUNT_DURATION, 1);
      const eased = 1 - (1 - progress) ** 3;
      setShown(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{format(shown)}</>;
};

const Background = ({ colors, id }: { colors: [string, string]; id: string }) => {
  const { width, height } = useWindowDimensions();
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
};

type Slide = { key: string; content: ReactNode };

export default function WrappedScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { t, language, hideAmounts } = usePreferences();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [index, setIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<ComponentRef<typeof View>>(null);

  useEffect(() => {
    const load = async () => {
      const year = new Date().getFullYear();
      const [charges, subscriptions, cancelled] = await Promise.all([
        getChargedItems(db, `${year}-01-01`, toIsoDate(new Date())),
        getSubscriptions(db),
        getCancelledSince(db, '0000-01-01'),
      ]);
      setStats(getWrappedStats(charges, subscriptions, cancelled));
    };
    load();
  }, [db]);

  if (!stats) return <View style={[styles.screen, { backgroundColor: BACKGROUNDS[0][1] }]} />;

  const money = (amount: number) => formatMoney(amount, language, hideAmounts);
  const monthName = (month: number) => getMonthName(new Date(stats.year, month, 1), language);

  const share = async () => {
    if (!shareRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
      hapticSuccess();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('wrapped.share') });
    } catch {
      // Αν ο χρήστης κλείσει το παράθυρο ή αποτύχει η εικόνα, απλά μένουμε στη διαφάνεια.
    } finally {
      setSharing(false);
    }
  };

  const summaryCard = (
    <View ref={shareRef} collapsable={false} style={styles.shareCard}>
      <Background colors={BACKGROUNDS[6]} id="shareBg" />
      <View style={styles.shareTop}>
        <AppLogo size={36} background="rgba(255,255,255,0.16)" />
        <Text style={styles.shareBrand}>{t('common.appName')}</Text>
      </View>
      <Text style={styles.shareTitle}>{t('wrapped.shareTitle', { year: stats.year })}</Text>
      <View style={styles.shareRows}>
        <ShareRow label={t('wrapped.shareTotal')} value={money(stats.total)} />
        {stats.top && <ShareRow label={t('wrapped.shareTop')} value={stats.top.subscription.name} />}
        {stats.categories[0] && (
          <ShareRow
            label={t('wrapped.shareCategory')}
            value={getCategoryLabel(stats.categories[0].category, t)}
          />
        )}
        <ShareRow label={t('wrapped.shareActive')} value={String(stats.activeCount)} />
        {stats.saved > 0 && <ShareRow label={t('wrapped.shareSaved')} value={money(stats.saved)} />}
      </View>
    </View>
  );

  const slides: Slide[] =
    stats.chargeCount === 0
      ? [
          {
            key: 'empty',
            content: (
              <>
                <Big>{t('wrapped.emptyTitle')}</Big>
                <Soft>{t('wrapped.emptyText')}</Soft>
              </>
            ),
          },
        ]
      : [
          {
            key: 'intro',
            content: (
              <>
                <Animated.View entering={ZoomIn.springify().damping(13)}>
                  <AppLogo size={72} background="rgba(255,255,255,0.16)" />
                </Animated.View>
                <Soft delay={150}>{t('wrapped.introLabel')}</Soft>
                <Big delay={250}>{t('wrapped.introTitle', { year: stats.year })}</Big>
                <Soft delay={450}>{t('wrapped.tapHint')}</Soft>
              </>
            ),
          },
          {
            key: 'total',
            content: (
              <>
                <Soft>{t('wrapped.totalLabel')}</Soft>
                <Text style={styles.huge}>
                  {hideAmounts ? money(stats.total) : <CountUp value={stats.total} format={money} />}
                </Text>
                <Soft delay={350}>
                  {t('wrapped.totalText', { count: stats.chargeCount, perDay: money(stats.perDay) })}
                </Soft>
              </>
            ),
          },
          ...(stats.top
            ? [
                {
                  key: 'top',
                  content: (
                    <>
                      <Soft>{t('wrapped.topLabel')}</Soft>
                      <Animated.View entering={ZoomIn.delay(100).springify().damping(12)}>
                        <ServiceLogo
                          id={stats.top.subscription.serviceId ?? stats.top.subscription.id}
                          name={stats.top.subscription.name}
                          fallbackColor={stats.top.subscription.color}
                          domain={
                            stats.top.subscription.serviceId
                              ? undefined
                              : stats.top.subscription.domain
                          }
                          size={88}
                        />
                      </Animated.View>
                      <Big delay={200}>{stats.top.subscription.name}</Big>
                      <Soft delay={350}>
                        {t('wrapped.topText', {
                          amount: money(stats.top.amount),
                          count: stats.top.count,
                        })}
                      </Soft>
                    </>
                  ),
                },
              ]
            : []),
          ...(stats.categories.length > 0
            ? [
                {
                  key: 'categories',
                  content: (
                    <>
                      <Soft>{t('wrapped.categoryLabel')}</Soft>
                      <Big delay={100}>{getCategoryLabel(stats.categories[0].category, t)}</Big>
                      <View style={styles.bars}>
                        {stats.categories.map((item, barIndex) => (
                          <Animated.View
                            key={item.category}
                            entering={FadeInDown.delay(250 + barIndex * 120).duration(360)}
                            style={styles.barRow}
                          >
                            <View style={styles.barLabels}>
                              <Text style={styles.barName}>{getCategoryLabel(item.category, t)}</Text>
                              <Text style={styles.barValue}>{`${item.share}%`}</Text>
                            </View>
                            <View style={styles.barTrack}>
                              <View
                                style={[
                                  styles.barFill,
                                  {
                                    width: `${Math.max(item.share, 3)}%`,
                                    backgroundColor: CATEGORY_COLORS[item.category] ?? WHITE,
                                  },
                                ]}
                              />
                            </View>
                          </Animated.View>
                        ))}
                      </View>
                    </>
                  ),
                },
              ]
            : []),
          ...(stats.busiestMonth
            ? [
                {
                  key: 'month',
                  content: (
                    <>
                      <Soft>{t('wrapped.monthLabel')}</Soft>
                      <Big delay={100}>{monthName(stats.busiestMonth.month)}</Big>
                      <Soft delay={300}>
                        {t('wrapped.monthText', { amount: money(stats.busiestMonth.amount) })}
                      </Soft>
                    </>
                  ),
                },
              ]
            : []),
          {
            key: 'moves',
            content: (
              <>
                <Soft>{t('wrapped.movesLabel')}</Soft>
                <View style={styles.moves}>
                  <Move delay={100} value={String(stats.activeCount)} label={t('wrapped.active')} />
                  <Move delay={220} value={String(stats.addedThisYear)} label={t('wrapped.added')} />
                  <Move
                    delay={340}
                    value={String(stats.cancelledThisYear)}
                    label={t('wrapped.cancelled')}
                  />
                </View>
                {stats.saved > 0 && (
                  <Soft delay={500}>{t('wrapped.savedText', { amount: money(stats.saved) })}</Soft>
                )}
              </>
            ),
          },
          {
            key: 'share',
            content: (
              <>
                <Animated.View entering={FadeInDown.duration(420)}>{summaryCard}</Animated.View>
                <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.shareActions}>
                  <Pressable
                    onPress={share}
                    disabled={sharing}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="share-outline" size={18} color="#14101F" />
                    <Text style={styles.shareButtonText}>{t('wrapped.share')}</Text>
                  </Pressable>
                </Animated.View>
              </>
            ),
          },
        ];

  const current = Math.min(index, slides.length - 1);
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const goNext = () => (isLast ? router.back() : setIndex(current + 1));
  const goBack = () => setIndex(Math.max(current - 1, 0));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Background colors={BACKGROUNDS[current % BACKGROUNDS.length]} id={`bg-${current}`} />

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.progress}>
          {slides.map((item, slideIndex) => (
            <View key={item.key} style={styles.progressTrack}>
              <View style={[styles.progressFill, slideIndex <= current && styles.progressDone]} />
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={WHITE} />
        </Pressable>
      </View>

      {/* Πάτημα δεξιά: επόμενη. Αριστερά: προηγούμενη. Όπως στα stories. */}
      <View style={styles.body}>
        <Pressable style={styles.tapBack} onPress={goBack} accessibilityLabel={t('wrapped.previous')} />
        <Pressable style={styles.tapNext} onPress={goNext} accessibilityLabel={t('wrapped.next')} />
        <View key={slide.key} style={styles.slide} pointerEvents="box-none">
          {slide.content}
        </View>
      </View>
    </View>
  );
}

const Big = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <Animated.Text entering={FadeInDown.delay(delay).duration(420)} style={styles.big}>
    {children}
  </Animated.Text>
);

const Soft = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <Animated.Text entering={FadeInDown.delay(delay).duration(420)} style={styles.soft}>
    {children}
  </Animated.Text>
);

const Move = ({ value, label, delay }: { value: string; label: string; delay: number }) => (
  <Animated.View entering={ZoomIn.delay(delay).springify().damping(13)} style={styles.move}>
    <Text style={styles.moveValue}>{value}</Text>
    <Text style={styles.moveLabel}>{label}</Text>
  </Animated.View>
);

const ShareRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.shareRow}>
    <Text style={styles.shareLabel}>{label}</Text>
    <Text style={styles.shareValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: { flex: 1, backgroundColor: 'transparent' },
  progressDone: { backgroundColor: WHITE },
  body: { flex: 1 },
  tapBack: { ...StyleSheet.absoluteFill, right: '65%', zIndex: 1 },
  tapNext: { ...StyleSheet.absoluteFill, left: '35%', zIndex: 1 },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    zIndex: 2,
  },
  big: { color: WHITE, fontSize: 40, fontFamily: fonts.semibold, letterSpacing: -1, lineHeight: 46 },
  huge: {
    color: WHITE,
    fontSize: 56,
    fontFamily: fonts.semibold,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  soft: { color: SOFT, fontSize: 17, fontFamily: fonts.regular, lineHeight: 25 },
  bars: { gap: spacing.md, marginTop: spacing.sm },
  barRow: { gap: 6 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barName: { color: WHITE, fontSize: 15, fontFamily: fonts.medium },
  barValue: { color: SOFT, fontSize: 15, fontFamily: fonts.medium },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  barFill: { height: 10, borderRadius: 5 },
  moves: { flexDirection: 'row', gap: spacing.md },
  move: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    gap: 2,
  },
  moveValue: { color: WHITE, fontSize: 30, fontFamily: fonts.semibold },
  moveLabel: { color: SOFT, fontSize: 13, fontFamily: fonts.regular, textAlign: 'center' },
  shareCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    gap: spacing.md,
  },
  shareTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shareBrand: { color: WHITE, fontSize: 16, fontFamily: fonts.semibold },
  shareTitle: { color: WHITE, fontSize: 26, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  shareRows: { gap: 12 },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  shareLabel: { color: SOFT, fontSize: 14, fontFamily: fonts.regular },
  shareValue: { flexShrink: 1, color: WHITE, fontSize: 16, fontFamily: fonts.semibold },
  shareActions: { alignItems: 'center' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: radius.full,
    backgroundColor: WHITE,
  },
  shareButtonText: { color: '#14101F', fontSize: 16, fontFamily: fonts.semibold },
  pressed: { opacity: 0.85 },
});
