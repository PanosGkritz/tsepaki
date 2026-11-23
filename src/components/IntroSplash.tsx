import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fonts } from '../constants/theme';
import { getSettings } from '../db/settings';
import { usePreferences } from '../providers/PreferencesProvider';
import { AppLogo } from './AppLogo';

const BRAND_GREEN = '#1F6F54';
const LOGO_SIZE = 112;
const SHINE_WIDTH = 56;

// Εμφάνιση, γυαλάδα πάνω στο logo, παύση, σβήσιμο. Την πρώτη φορά μένει περισσότερο,
// μετά πιο σύντομα, γιατί την εφαρμογή την ανοίγεις συχνά.
const SHINE_DELAY = 650;
const SHINE_DURATION = 750;
const FIRST_TIME_VISIBLE = 2500;
const VISIBLE = 1800;
const FADE_OUT = 300;

// Όσοι περιμένουν να τελειώσει η οθόνη έναρξης (π.χ. η υποδοχή, για να ανοίξει το πληκτρολόγιο).
let isDone = false;
const doneListeners = new Set<() => void>();

const finish = () => {
  isDone = true;
  doneListeners.forEach((listener) => listener());
  doneListeners.clear();
};

export const onIntroSplashDone = (listener: () => void) => {
  if (isDone) {
    listener();
    return () => {};
  }
  doneListeners.add(listener);
  return () => {
    doneListeners.delete(listener);
  };
};

const NAMES = { el: 'Τσεπάκι', en: 'Tsepaki' } as const;

// Η πρώτη οθόνη σε κάθε άνοιγμα: πράσινο φόντο, το logo στη μέση και το όνομα από κάτω.
export const IntroSplash = () => {
  const db = useSQLiteContext();
  const { language } = usePreferences();
  const [isVisible, setIsVisible] = useState(true);
  const scale = useSharedValue(0.86);
  const opacity = useSharedValue(0);
  const shine = useSharedValue(-SHINE_WIDTH * 1.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    opacity.value = withTiming(1, { duration: 380 });
    shine.value = withDelay(
      SHINE_DELAY,
      withTiming(LOGO_SIZE + SHINE_WIDTH, {
        duration: SHINE_DURATION,
        easing: Easing.inOut(Easing.cubic),
        // Με «Μείωση κίνησης» η γυαλάδα παραλείπεται.
        reduceMotion: ReduceMotion.System,
      }),
    );

    let timer: ReturnType<typeof setTimeout> | undefined;
    let isActive = true;
    getSettings(db)
      .then((settings) => settings.onboardingDone)
      .catch(() => true)
      .then((onboardingDone) => {
        if (!isActive) return;
        timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(finish, FADE_OUT);
        }, onboardingDone ? VISIBLE : FIRST_TIME_VISIBLE);
      });

    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }, [db, opacity, scale, shine]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shine.value }, { rotate: '20deg' }],
  }));

  if (!isVisible) return null;

  return (
    <Animated.View exiting={FadeOut.duration(FADE_OUT)} style={styles.screen}>
      <StatusBar style="light" />

      <Animated.View style={[styles.logo, logoStyle]}>
        <AppLogo size={LOGO_SIZE} background="rgba(255,255,255,0.14)" />
        <Animated.View style={[styles.shine, shineStyle]}>
          <Svg width={SHINE_WIDTH} height={LOGO_SIZE * 1.6}>
            <Defs>
              <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.45" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width={SHINE_WIDTH} height={LOGO_SIZE * 1.6} fill="url(#shine)" />
          </Svg>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(280).duration(420)}>
        <Text style={styles.name}>{NAMES[language]}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE * 0.23,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: -LOGO_SIZE * 0.3,
    left: 0,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: fonts.semibold,
    letterSpacing: -0.3,
  },
});

