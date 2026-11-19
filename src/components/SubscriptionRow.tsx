import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/theme';
import { formatEuro } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
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
}: SubscriptionRowProps) => {
  const styles = useStyles();
  const { language } = usePreferences();
  const price = formatEuro(subscription.price, language);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${subscription.name}, ${price}`}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.rowDivider,
        pressed && styles.pressed,
      ]}
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

      <Text style={styles.price}>{price}</Text>
    </Pressable>
  );
};

const useStyles = createStyles((colors) => ({
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
}));