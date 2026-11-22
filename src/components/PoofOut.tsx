import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { createStyles } from '../lib/styles';

export const POOF_DURATION = 460;

const PARTICLE_COUNT = 12;
const EASING = Easing.out(Easing.cubic);

// Σταθερές θέσεις για κάθε τελίτσα, ώστε το «πουφ» να είναι ίδιο κάθε φορά.
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + (index % 2 ? 0.2 : -0.1);
  const distance = index % 3 === 0 ? 70 : index % 3 === 1 ? 52 : 38;
  return {
    x: Math.cos(angle) * distance,
    // Η γραμμή είναι φαρδιά και χαμηλή, οπότε οι τελίτσες απλώνουν περισσότερο στο πλάτος.
    y: Math.sin(angle) * distance * 0.45,
    size: index % 2 ? 6 : 8,
  };
});

type PoofOutProps = {
  active: boolean;
  color: string;
  children: React.ReactNode;
};

// Τυλίγει μια γραμμή: όταν γίνει active, η γραμμή μαζεύεται και σβήνει
// ενώ μικρές τελίτσες στο χρώμα της ενέργειας σκορπίζουν από το κέντρο.
export const PoofOut = ({ active, color, children }: PoofOutProps) => {
  const styles = useStyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = active ? withTiming(1, { duration: POOF_DURATION, easing: EASING }) : 0;
  }, [active, progress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0, 0.45], [1, 0.88], 'clamp') }],
  }));

  return (
    <View>
      <Animated.View style={contentStyle}>{children}</Animated.View>
      {active && (
        <View pointerEvents="none" style={styles.burst}>
          {PARTICLES.map((particle, index) => (
            <Particle key={index} progress={progress} color={color} {...particle} />
          ))}
        </View>
      )}
    </View>
  );
};

type ParticleProps = {
  progress: SharedValue<number>;
  color: string;
  x: number;
  y: number;
  size: number;
};

const Particle = ({ progress, color, x, y, size }: ParticleProps) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 1], [0, 1, 0], 'clamp'),
    transform: [
      { translateX: x * progress.value },
      { translateY: y * progress.value },
      { scale: interpolate(progress.value, [0, 1], [1, 0.3]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
};

const useStyles = createStyles(() => ({
  burst: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
