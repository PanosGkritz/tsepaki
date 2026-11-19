import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { fonts, radius } from '../constants/theme';
import { getCategoryLabel } from '../data/categories';
import { getServiceName, type ServiceTemplate } from '../data/services';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import { ServiceLogo } from './ServiceLogo';

type ServiceCardProps = {
  service: ServiceTemplate;
  isAdded: boolean;
  onPress: () => void;
};

export const ServiceCard = ({ service, isAdded, onPress }: ServiceCardProps) => {
  const styles = useStyles();
  const { colors, t } = usePreferences();
  const name = getServiceName(service, t);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isAdded ? `${name}, ${t('add.added')}` : name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <ServiceLogo id={service.id} name={name} fallbackColor={service.color} size={44} />
        <View style={[styles.badge, isAdded && styles.badgeAdded]}>
          <Ionicons
            name={isAdded ? 'checkmark' : 'add'}
            size={18}
            color={isAdded ? colors.onAccent : colors.text}
          />
        </View>
      </View>

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.category}>{getCategoryLabel(service.category, t)}</Text>
      </View>
    </Pressable>
  );
};

const useStyles = createStyles((colors) => ({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAdded: { backgroundColor: colors.accent },
  text: { gap: 2 },
  name: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  category: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
}));