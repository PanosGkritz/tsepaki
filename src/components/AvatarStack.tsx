import { Text, View } from 'react-native';
import Animated, { LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { fonts } from '../constants/theme';
import { getAvatarColor, getInitials } from '../lib/share';
import { createStyles } from '../lib/styles';

type AvatarStackProps = {
  names: string[];
  size?: number;
  max?: number;
  animated?: boolean;
};

const POP = ZoomIn.springify().damping(14).stiffness(220);
const SHRINK = ZoomOut.duration(160);
const SLIDE = LinearTransition.springify().damping(18);

// Κυκλάκια με τα αρχικά, το ένα λίγο πάνω στο άλλο. Με animated, κάθε νέο «σκάει» με ελατήριο.
export const AvatarStack = ({ names, size = 22, max = 4, animated = false }: AvatarStackProps) => {
  const styles = useStyles();
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  const overlap = Math.round(size * 0.3);

  return (
    <View style={styles.row} accessibilityLabel={names.join(', ')}>
      {shown.map((name, index) => (
        <Animated.View
          key={name}
          entering={animated ? POP : undefined}
          exiting={animated ? SHRINK : undefined}
          layout={animated ? SLIDE : undefined}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -overlap,
              backgroundColor: getAvatarColor(name),
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.42 }]}>{getInitials(name)}</Text>
        </Animated.View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.avatar,
            styles.extra,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -overlap },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.4 }]}>{`+${extra}`}</Text>
        </View>
      )}
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  initials: { color: '#FFFFFF', fontFamily: fonts.semibold },
  extra: { backgroundColor: colors.surfaceRaised },
  extraText: { color: colors.text, fontFamily: fonts.medium },
}));
