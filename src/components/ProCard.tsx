import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fonts, radius, spacing } from '../constants/theme';
import type { StringKey } from '../i18n';
import { hapticSuccess } from '../lib/haptics';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';

// Η τιμή του Pro: εφάπαξ αγορά, όχι συνδρομή.
export const PRO_PRICE = '1,49 €';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// «soon»: δεν υπάρχει ακόμα στην εφαρμογή. Το σβήνουμε όταν φτιαχτεί.
const BENEFITS: { icon: IconName; key: StringKey; soon?: true }[] = [
  { icon: 'people-outline', key: 'pro.benefitShared' },
  { icon: 'trending-up-outline', key: 'pro.benefitPrices', soon: true },
  { icon: 'bulb-outline', key: 'pro.benefitSave', soon: true },
  { icon: 'sparkles-outline', key: 'pro.benefitWrapped', soon: true },
  { icon: 'apps-outline', key: 'pro.benefitWidgets', soon: true },
];

const IRIS = ['#7C3AED', '#C026D3', '#3B82F6', '#14B8A6'];
const CARD = '#121016';
const WHITE = '#FFFFFF';
const LAVENDER = '#C4B5FD';

// Γεμίζει όλο τον χώρο του γονέα με τα χρώματα της ίριδας. Μετράμε πρώτα το μέγεθος,
// γιατί με «100%» το SVG δεν γέμιζε πάντα ολόκληρο το στοιχείο.
const IrisFill = ({ id }: { id: string }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current?.width === width && current.height === height ? current : { width, height },
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {size && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              {IRIS.map((color, index) => (
                <Stop key={color} offset={index / (IRIS.length - 1)} stopColor={color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
};

// Η ετικέτα «PRO» με τα χρώματα της ίριδας. Μπαίνει και στην αρχική σε όσους έχουν το Pro.
export const ProBadge = ({ id = 'proBadge' }: { id?: string }) => {
  const styles = useStyles();
  return (
    <View style={styles.badge} accessibilityLabel="Pro">
      <IrisFill id={id} />
      <Text style={styles.badgeText}>PRO</Text>
    </View>
  );
};

// Μαύρη κάρτα με περίγραμμα σαν ίριδα: τα πλεονεκτήματα του Pro, η τιμή και το κουμπί αγοράς.
export const ProCard = () => {
  const styles = useStyles();
  const { t, isPro, setDevPro } = usePreferences();

  const buy = async () => {
    // Οι πληρωμές του Google Play μπαίνουν με τη δημοσίευση. Μέχρι τότε, στο Expo Go
    // το κουμπί απλά ανοίγει το Pro για δοκιμή.
    if (__DEV__) {
      await setDevPro(true);
      hapticSuccess();
      return;
    }
    Alert.alert(t('pro.soonTitle'), t('pro.soonMessage'));
  };

  return (
    <View style={styles.border}>
      <IrisFill id="proBorder" />
      <View style={styles.card}>
        <View style={styles.header}>
          <ProBadge />
          <Text style={styles.title}>{t('pro.title')}</Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.key} style={styles.benefit}>
              <Ionicons name={benefit.icon} size={18} color={LAVENDER} />
              <Text style={styles.benefitText}>{t(benefit.key)}</Text>
              {benefit.soon && <Text style={styles.soon}>{t('pro.soon')}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{PRO_PRICE}</Text>
          <Text style={styles.priceNote}>{t('pro.oneTime')}</Text>
        </View>

        <Pressable
          onPress={buy}
          disabled={isPro}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <IrisFill id="proButton" />
          <Text style={styles.buttonText}>{t(isPro ? 'pro.active' : 'pro.buy')}</Text>
          {isPro && <Ionicons name="checkmark" size={18} color={WHITE} />}
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = createStyles(() => ({
  border: {
    borderRadius: radius.lg + 2,
    padding: 1.5,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: CARD,
    borderRadius: radius.lg,
    padding: 20,
    gap: spacing.md,
  },
  header: { gap: 10, alignItems: 'flex-start' },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeText: { color: WHITE, fontSize: 12, fontFamily: fonts.semibold, letterSpacing: 1 },
  title: { color: WHITE, fontSize: 20, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  benefits: { gap: 10 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  soon: {
    color: LAVENDER,
    fontSize: 11,
    fontFamily: fonts.medium,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.4)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { color: WHITE, fontSize: 28, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  priceNote: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: fonts.regular },
  button: {
    height: 52,
    borderRadius: radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  buttonText: { color: WHITE, fontSize: 16, fontFamily: fonts.semibold },
}));
