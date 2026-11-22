import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/theme';
import { formatMoney } from '../lib/format';
import { getShareBreakdown } from '../lib/share';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { Subscription } from '../types/subscription';
import { AvatarStack } from './AvatarStack';
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
  const { share } = subscription;
  const breakdown = share ? getShareBreakdown(subscription.price, share) : null;
  const price = formatMoney(breakdown ? breakdown.mine : subscription.price, language, hideAmount);
  const total = formatMoney(subscription.price, language, hideAmount);

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
        {share && (
          <View style={styles.shareRow}>
            <AvatarStack names={share.people.map((person) => person.name)} size={18} />
            <Text style={styles.shareText} numberOfLines={1}>
              {share.payer
                ? t('share.rowPayer', { total, name: share.payer })
                : t('share.rowTotal', { total, count: share.people.length })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.side}>
        <Text style={styles.price}>{price}</Text>
        {share && <Text style={styles.you}>{t('share.you')}</Text>}
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
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  shareText: { flexShrink: 1, color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular },
  you: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.medium, marginTop: -4 },
  price: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
}));