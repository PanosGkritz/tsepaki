import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../constants/theme';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';

export const SUCCESS_DURATION = 800;

const CIRCLE_SIZE = 88;

type SuccessCheckProps = { label: string };

// Πράσινο τικ που «σκάει» πάνω από τη φόρμα όταν αποθηκεύεται μια νέα συνδρομή.
export const SuccessCheck = ({ label }: SuccessCheckProps) => {
  const styles = useStyles();
  const { colors } = usePreferences();
  const ring = useSharedValue(0);

  useEffect(() => {
    ring.value = withDelay(120, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [ring]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ring.value),
    transform: [{ scale: 1 + ring.value * 0.8 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.overlay} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.circle}>
          <Animated.View entering={ZoomIn.delay(140).duration(220)}>
            <Ionicons name="checkmark" size={46} color={colors.onAccent} />
          </Animated.View>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(180).duration(200)}>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const useStyles = createStyles((colors) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: colors.background,
  },
  center: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.accentBright,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.text, fontSize: 17, fontFamily: fonts.medium },
}));
