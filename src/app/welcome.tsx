import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { WelcomeIntro } from '../components/WelcomeIntro';
import { fonts, radius, spacing } from '../constants/theme';
import { saveSetting } from '../db/settings';
import type { Language } from '../i18n';
import {
  MAIN_CURRENCIES,
  OTHER_CURRENCIES,
  getCurrencyLabel,
  type CurrencyCode,
} from '../lib/currency';
import { requestPermission } from '../lib/notifications';
import { syncReminders } from '../lib/reminders';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'el', label: 'ΕΛ' },
  { value: 'en', label: 'EN' },
];

const askForNotifications = async () => {
  try {
    await requestPermission();
  } catch {
    // Αν δεν δοθεί άδεια, ο χρήστης μπορεί να την ενεργοποιήσει αργότερα από τις Ρυθμίσεις.
  }
};

export default function Welcome() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language, setLanguage, currency, setCurrency } = usePreferences();
  const [showOtherCurrencies, setShowOtherCurrencies] = useState(() =>
    OTHER_CURRENCIES.some((code) => code === currency),
  );
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Μετράμε μόνοι μας το πληκτρολόγιο: το κουμπί κάθεται ακριβώς από πάνω του
  // και η οθόνη κυλάει ώστε να φαίνεται το όνομα που γράφεις.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const isKeyboardOpen = keyboardHeight > 0;

  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0 && !saving;

  const finish = async () => {
    if (!canContinue) return;

    setSaving(true);
    await setLanguage(language);
    await setCurrency(currency);
    await saveSetting(db, 'userName', trimmedName);
    await saveSetting(db, 'onboardingDone', true);
    await askForNotifications();
    await syncReminders(db);
    setShowIntro(true);
  };

  if (showIntro) {
    return <WelcomeIntro onContinue={() => router.replace('/')} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.languageRow}>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.value === language;
          return (
            <Pressable
              key={option.value}
              onPress={() => setLanguage(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={option.value === 'el' ? 'Ελληνικά' : 'English'}
              style={[styles.languageChip, isActive && styles.languageChipActive]}
            >
              <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          {!isKeyboardOpen && <AppLogo size={72} />}
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('settings.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('settings.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={finish}
            accessibilityLabel={t('settings.nameLabel')}
          />
          <Text style={styles.hint}>{t('welcome.hint')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('currency.label')}</Text>
          <View style={styles.currencyRow}>
            {MAIN_CURRENCIES.map((code) => (
              <CurrencyChip
                key={code}
                code={code}
                isActive={currency === code}
                onPress={() => setCurrency(code)}
              />
            ))}
            {!showOtherCurrencies && (
              <Pressable
                onPress={() => setShowOtherCurrencies(true)}
                accessibilityRole="button"
                style={styles.currencyChip}
              >
                <Text style={styles.currencyText}>{t('currency.other')}</Text>
              </Pressable>
            )}
            {showOtherCurrencies &&
              OTHER_CURRENCIES.map((code) => (
                <CurrencyChip
                  key={code}
                  code={code}
                  isActive={currency === code}
                  onPress={() => setCurrency(code)}
                />
              ))}
          </View>
          <Text style={styles.hint}>{t('currency.welcomeHint')}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, isKeyboardOpen && { paddingBottom: keyboardHeight + 12 }]}>
        <Pressable
          onPress={finish}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          style={({ pressed }) => [
            styles.button,
            !canContinue && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>{t('welcome.start')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type CurrencyChipProps = { code: CurrencyCode; isActive: boolean; onPress: () => void };

const CurrencyChip = ({ code, isActive, onPress }: CurrencyChipProps) => {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={code}
      style={[styles.currencyChip, isActive && styles.languageChipActive]}
    >
      <Text style={[styles.currencyText, isActive && styles.languageTextActive]}>
        {getCurrencyLabel(code)}
      </Text>
    </Pressable>
  );
};

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: 64,
  },
  languageChip: {
    height: 32,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageChipActive: { backgroundColor: colors.text },
  languageText: { color: colors.text, fontSize: 13, fontFamily: fonts.medium },
  languageTextActive: { color: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 32,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  intro: { gap: spacing.md },
  title: { color: colors.text, fontSize: 32, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 16, fontFamily: fonts.regular, lineHeight: 23 },
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 54,
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.regular,
  },
  hint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 18 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  currencyChip: {
    height: 40,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 40 },
  button: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.onAccent, fontSize: 16, fontFamily: fonts.semibold },
}));