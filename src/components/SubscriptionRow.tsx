import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/theme';
import { formatMoney } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { ServiceLogo } from './ServiceLogo';

type SubscriptionRowProps = {
  subscription: Subscription;
  subtitle: React.ReactNode;
  showDivider: boolean;
  onPress?: () => void;
  action?: React.ReactNode;
  hideAmount?: boolean;
};

export const SubscriptionRow = ({
  subscription,
  subtitle,
  showDivider,
  onPress,
  action,
  hideAmount = false,
}: SubscriptionRowProps) => {
  const styles = useStyles();
  const { language, t } = usePreferences();
  const price = formatMoney(subscription.price, language, hideAmount);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={hideAmount ? subscription.name : `${subscription.name}, ${price}`}
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
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {subscription.name}
          </Text>
          {subscription.isTrial && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>{t('form.trialBadge')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
          {subscription.card ? ` · ${subscription.card}` : ''}
        </Text>
      </View>

      <View style={styles.side}>
        <Text style={styles.price}>{price}</Text>
        {action}
      </View>
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  trialBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
  },
  trialText: { color: colors.accentBright, fontSize: 11, fontFamily: fonts.medium },
  subtitle: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  side: { alignItems: 'flex-end', gap: 6 },
  price: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
}));