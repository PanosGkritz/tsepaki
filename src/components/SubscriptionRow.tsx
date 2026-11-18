import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { formatEuro } from '../lib/format';
import type { Subscription } from '../types/subscription';
import { ServiceLogo } from './ServiceLogo';

type SubscriptionRowProps = {
  subscription: Subscription;
  subtitle: React.ReactNode;
  showDivider: boolean;
  onPress?: () => void;
};

export const SubscriptionRow = ({
  subscription,
  subtitle,
  showDivider,
  onPress,
}: SubscriptionRowProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole="button"
    accessibilityLabel={`${subscription.name}, ${formatEuro(subscription.price)}`}
    style={({ pressed }) => [styles.row, showDivider && styles.rowDivider, pressed && styles.pressed]}
  >
    <ServiceLogo
      id={subscription.serviceId ?? subscription.id}
      name={subscription.name}
      fallbackColor={subscription.color}
      domain={subscription.serviceId ? undefined : subscription.domain}
      size={42}
    />

    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>
        {subscription.name}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>

    <Text style={styles.price}>{formatEuro(subscription.price)}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  info: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  subtitle: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  price: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
});