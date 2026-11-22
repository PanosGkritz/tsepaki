import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import type { StringKey } from '../i18n';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import { AppLogo } from './AppLogo';

// Το πράσινο του logo, ίδιο σε ανοιχτό και σκούρο θέμα.
const BRAND_GREEN = '#1F6F54';
const WHITE = '#FFFFFF';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IconName; key: StringKey }[] = [
  { icon: 'notifications-outline', key: 'intro.reminders' },
  { icon: 'flash-outline', key: 'intro.catalog' },
  { icon: 'pie-chart-outline', key: 'intro.overview' },
  { icon: 'lock-closed-outline', key: 'intro.privacy' },
];

const FEATURE_DELAY = 420;
const FEATURE_STEP = 130;

type WelcomeIntroProps = {
  onContinue: () => void;
};

// Μεταβατική οθόνη μετά την υποδοχή: τι κάνει η εφαρμογή, με απαλή είσοδο ένα-ένα.
export const WelcomeIntro = ({ onContinue }: WelcomeIntroProps) => {
  const styles = useStyles();
  const { t } = usePreferences();
  const buttonDelay = FEATURE_DELAY + FEATURES.length * FEATURE_STEP + 150;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <Animated.View entering={ZoomIn.springify().damping(13)}>
          <AppLogo size={64} background="rgba(255,255,255,0.14)" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(380)} style={styles.heading}>
          <Text style={styles.title}>{t('intro.title')}</Text>
          <Text style={styles.subtitle}>{t('intro.subtitle')}</Text>
        </Animated.View>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.key}
              entering={FadeInDown.delay(FEATURE_DELAY + index * FEATURE_STEP).duration(360)}
              style={styles.feature}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color={WHITE} />
              </View>
              <Text style={styles.featureText}>{t(feature.key)}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInUp.delay(buttonDelay).duration(360)} style={styles.footer}>
        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{t('intro.continue')}</Text>
          <Ionicons name="arrow-forward" size={18} color={BRAND_GREEN} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const useStyles = createStyles(() => ({
  screen: { flex: 1, backgroundColor: BRAND_GREEN },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 96,
    gap: spacing.xl,
  },
  heading: { gap: spacing.sm },
  title: { color: WHITE, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontFamily: fonts.regular,
    lineHeight: 23,
  },
  features: { gap: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    color: WHITE,
    fontSize: 16,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: 48 },
  button: {
    height: 56,
    borderRadius: radius.full,
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  buttonText: { color: BRAND_GREEN, fontSize: 16, fontFamily: fonts.semibold },
}));
