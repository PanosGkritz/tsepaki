import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fonts, radius, spacing } from '../constants/theme';
import { CATEGORIES, getCategoryLabel, isCategory, type Category } from '../data/categories';
import {
  CATALOG_PRICES_AS_OF,
  getDefaultPlan,
  getPlanCycle,
  getPlanPrice,
  getServiceName,
  type ServicePlan,
  type ServiceTemplate,
} from '../data/services';
import { getCardLabels } from '../db/subscriptions';
import { LOCALES, type Language, type StringKey } from '../i18n';
import { pickColor } from '../lib/colors';
import { formatFullDate, parseIsoDate, toIsoDate } from '../lib/dates';
import { formatMoney } from '../lib/format';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type {
  BillingCycle,
  NewSubscription,
  PaymentMode,
  Subscription,
} from '../types/subscription';
import { ServiceLogo } from './ServiceLogo';

type SegmentOption<T extends string> = { value: T; key: StringKey };

const CYCLES: SegmentOption<BillingCycle>[] = [
  { value: 'monthly', key: 'form.monthly' },
  { value: 'yearly', key: 'form.yearly' },
];

const PAYMENT_MODES: SegmentOption<PaymentMode>[] = [
  { value: 'auto', key: 'form.paymentAuto' },
  { value: 'manual', key: 'form.paymentManual' },
];

const CARD_MAX_LENGTH = 30;

// Ολόκληρος αριθμός κάρτας δεν αποθηκεύεται ποτέ: 7+ συνεχόμενα ψηφία (με κενά ή παύλες) απορρίπτονται.
const looksLikeCardNumber = (text: string) => /\d{7,}/.test(text.replace(/[\s-]/g, ''));

const parsePrice = (text: string) => {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
};

// 159.9 → «159,90». Τα ακέραια ποσά μένουν χωρίς δεκαδικά, π.χ. «25».
const formatPriceInput = (price: number, language: Language) => {
  const text = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return language === 'el' ? text.replace('.', ',') : text;
};

const initialCategory = (initial?: Subscription, service?: ServiceTemplate): Category => {
  if (initial && isCategory(initial.category)) return initial.category;
  return service?.category ?? 'other';
};

// Οι online υπηρεσίες του καταλόγου τραβιούνται από κάρτα. Οι υπόλοιπες πληρώνονται με το χέρι.
const initialPaymentMode = (initial?: Subscription, service?: ServiceTemplate): PaymentMode => {
  if (initial) return initial.paymentMode;
  return service?.domain ? 'auto' : 'manual';
};

type SubscriptionFormProps = {
  title: string;
  submitLabel: string;
  service?: ServiceTemplate;
  initial?: Subscription;
  onSubmit: (values: NewSubscription) => Promise<void>;
  footer?: React.ReactNode;
};

export const SubscriptionForm = ({
  title,
  submitLabel,
  service,
  initial,
  onSubmit,
  footer,
}: SubscriptionFormProps) => {
  const styles = useStyles();
  const db = useSQLiteContext();
  const { colors, isDark, t, language } = usePreferences();
  const [name, setName] = useState(
    initial?.name ?? (service ? getServiceName(service, t) : ''),
  );
  const defaultPlan = initial ? undefined : getDefaultPlan(service);
  const defaultCycle = defaultPlan ? getPlanCycle(defaultPlan, 'monthly') : 'monthly';
  const defaultPrice = defaultPlan ? getPlanPrice(defaultPlan, defaultCycle) : undefined;
  const [priceText, setPriceText] = useState(() => {
    if (initial) return formatPriceInput(initial.price, language);
    return defaultPrice !== undefined ? formatPriceInput(defaultPrice, language) : '';
  });
  const [cycle, setCycle] = useState<BillingCycle>(initial?.cycle ?? defaultCycle);
  const [nextDate, setNextDate] = useState(
    initial ? parseIsoDate(initial.nextChargeDate) : new Date(),
  );
  const [category, setCategory] = useState<Category>(initialCategory(initial, service));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialPaymentMode(initial, service),
  );
  const [isTrial, setIsTrial] = useState(initial?.isTrial ?? false);
  const [card, setCard] = useState(initial?.card ?? '');
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCardLabels(db).then(setSavedCards);
  }, [db]);

  const price = parsePrice(priceText);
  const trimmedCard = card.trim();
  const trimmedName = name.trim();
  const color = service?.color ?? initial?.color ?? pickColor(trimmedName || '?');
  const plans = service?.plans ?? [];
  const selectedPlan = plans.find((plan) => getPlanPrice(plan, cycle) === price);

  const selectPlan = (plan: ServicePlan) => {
    const planCycle = getPlanCycle(plan, cycle);
    const planPrice = getPlanPrice(plan, planCycle);
    if (planPrice === undefined) return;
    setCycle(planCycle);
    setPriceText(formatPriceInput(planPrice, language));
  };

  // Αν έχει διαλέξει πακέτο, η αλλαγή συχνότητας φέρνει και την τιμή του πακέτου.
  const changeCycle = (nextCycle: BillingCycle) => {
    setCycle(nextCycle);
    const nextPrice = selectedPlan ? getPlanPrice(selectedPlan, nextCycle) : undefined;
    if (nextPrice !== undefined) setPriceText(formatPriceInput(nextPrice, language));
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowAndroidPicker(false);
    if (event.type === 'set' && date) setNextDate(date);
  };

  const handleSave = async () => {
    if (!trimmedName) {
      setError('form.errorName');
      return;
    }
    if (price === null) {
      setError('form.errorPrice');
      return;
    }
    if (looksLikeCardNumber(trimmedCard)) {
      setError('form.errorCard');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        name: trimmedName,
        price,
        cycle,
        nextChargeDate: toIsoDate(nextDate),
        color,
        category,
        paymentMode,
        serviceId: service?.id ?? initial?.serviceId,
        domain: service?.domain ?? initial?.domain,
        card: trimmedCard || undefined,
        isTrial,
      });
    } catch {
      setError('form.errorSave');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('form.close')}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <ServiceLogo
            id={service?.id ?? initial?.serviceId ?? initial?.id ?? 'custom'}
            name={trimmedName || '?'}
            fallbackColor={color}
            domain={service ? undefined : initial?.domain}
            size={64}
          />
          <Text style={styles.heroName} numberOfLines={1}>
            {trimmedName || t('form.heroPlaceholder')}
          </Text>
        </View>

        <Field label={t('form.name')}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('form.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel={t('form.nameLabel')}
          />
        </Field>

        {plans.length > 1 && (
          <Field label={t('form.plan')}>
            <View style={styles.chips}>
              {plans.map((plan) => {
                const isActive = plan === selectedPlan;
                const planCycle = getPlanCycle(plan, cycle);
                const planPrice = getPlanPrice(plan, planCycle) ?? 0;
                const suffix = t(planCycle === 'yearly' ? 'form.perYear' : 'form.perMonth');
                return (
                  <Pressable
                    key={plan.name}
                    onPress={() => selectPlan(plan)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {`${plan.name} · ${formatMoney(planPrice, language)}${suffix}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              {t('form.planHint', { date: CATALOG_PRICES_AS_OF[language] })}
            </Text>
          </Field>
        )}

        {plans.length === 1 && (
          <Text style={styles.hint}>
            {t('form.planHint', { date: CATALOG_PRICES_AS_OF[language] })}
          </Text>
        )}

        <Field label={t('form.price')}>
          <View style={styles.priceRow}>
            <TextInput
              value={priceText}
              onChangeText={setPriceText}
              placeholder={language === 'el' ? '0,00' : '0.00'}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[styles.input, styles.priceInput]}
              accessibilityLabel={t('form.priceLabel')}
            />
            <Text style={styles.currency}>€</Text>
          </View>
        </Field>

        <Field label={t('form.cycle')}>
          <Segment options={CYCLES} value={cycle} onChange={changeCycle} />
        </Field>

        <Field label={t('form.payment')}>
          <Segment options={PAYMENT_MODES} value={paymentMode} onChange={setPaymentMode} />
          <Text style={styles.hint}>
            {t(paymentMode === 'auto' ? 'form.paymentAutoHint' : 'form.paymentManualHint')}
          </Text>
        </Field>

        <View style={styles.trialRow}>
          <View style={styles.trialInfo}>
            <Text style={styles.trialLabel}>{t('form.trial')}</Text>
            <Text style={styles.hint}>{t('form.trialHint')}</Text>
          </View>
          <Switch
            value={isTrial}
            onValueChange={setIsTrial}
            trackColor={{ true: colors.accent, false: colors.surfaceRaised }}
            thumbColor="#FFFFFF"
            accessibilityLabel={t('form.trial')}
          />
        </View>

        <Field label={t(isTrial ? 'form.trialEnds' : 'form.nextCharge')}>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosDateRow}>
              <Text style={styles.dateText}>{formatFullDate(nextDate, language)}</Text>
              <DateTimePicker
                value={nextDate}
                mode="date"
                display="compact"
                locale={LOCALES[language]}
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={colors.accentBright}
                onChange={onDateChange}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAndroidPicker(true)}
              accessibilityRole="button"
              style={styles.input}
            >
              <Text style={styles.dateText}>{formatFullDate(nextDate, language)}</Text>
            </Pressable>
          )}
          {showAndroidPicker && (
            <DateTimePicker value={nextDate} mode="date" onChange={onDateChange} />
          )}
        </Field>

        <Field label={t('form.card')}>
          <TextInput
            value={card}
            onChangeText={setCard}
            placeholder={t('form.cardPlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={CARD_MAX_LENGTH}
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel={t('form.cardLabel')}
          />
          {savedCards.length > 0 && (
            <View style={styles.chips}>
              {savedCards.map((item) => {
                const isActive = item === trimmedCard;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setCard(isActive ? '' : item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <Text style={styles.hint}>{t('form.cardHint')}</Text>
        </Field>

        <Field label={t('form.category')}>
          <View style={styles.chips}>
            {CATEGORIES.map((item) => {
              const isActive = item === category;
              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {getCategoryLabel(item, t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {error && <Text style={styles.error}>{t(error)}</Text>}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.saveButton,
            (pressed || saving) && styles.saveButtonPressed,
          ]}
        >
          <Text style={styles.saveButtonText}>{saving ? t('form.saving') : submitLabel}</Text>
        </Pressable>

        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

type FieldProps = { label: string; children: React.ReactNode };

const Field = ({ label, children }: FieldProps) => {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
};

type SegmentProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const Segment = <T extends string,>({ options, value, onChange }: SegmentProps<T>) => {
  const styles = useStyles();
  const { t } = usePreferences();

  return (
    <View style={styles.segment}>
      {options.map((item) => {
        const isActive = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.segmentItem, isActive && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
              {t(item.key)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 22, fontFamily: fonts.semibold },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  heroName: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold },
  field: { gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    justifyContent: 'center',
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: { flex: 1, fontVariant: ['tabular-nums'] },
  currency: { color: colors.textMuted, fontSize: 18, fontFamily: fonts.medium },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: colors.surfaceRaised },
  segmentText: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.medium },
  segmentTextActive: { color: colors.text },
  hint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 18 },
  trialRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trialInfo: { flex: 1, gap: 4 },
  trialLabel: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  iosDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    height: 52,
  },
  dateText: { color: colors.text, fontSize: 16, fontFamily: fonts.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  chipTextActive: { color: colors.background },
  error: { color: colors.warning, fontSize: 14, fontFamily: fonts.medium },
  saveButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: { opacity: 0.8 },
  saveButtonText: { color: colors.onAccent, fontSize: 16, fontFamily: fonts.semibold },
}));