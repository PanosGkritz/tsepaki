import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../constants/theme';
import type { ServiceTemplate } from '../data/services';
import { ServiceLogo } from './ServiceLogo';

type ServiceCardProps = {
  service: ServiceTemplate;
  isAdded: boolean;
  onPress: () => void;
};

export const ServiceCard = ({ service, isAdded, onPress }: ServiceCardProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={isAdded ? `${service.name}, έχει προστεθεί` : `Προσθήκη ${service.name}`}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
  >
    <View style={styles.top}>
      <ServiceLogo id={service.id} name={service.name} fallbackColor={service.color} size={44} />

      <View style={[styles.action, isAdded && styles.actionAdded]}>
        <Ionicons
          name={isAdded ? 'checkmark' : 'add'}
          size={18}
          color={isAdded ? colors.accentBright : colors.text}
        />
      </View>
    </View>

    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={2}>
        {service.name}
      </Text>
      <Text style={styles.category}>{service.category}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  action: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionAdded: { backgroundColor: 'rgba(76,195,138,0.15)' },
  info: { gap: 2 },
  name: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  category: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
});