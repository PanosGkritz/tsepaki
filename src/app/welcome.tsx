import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { fonts, radius, spacing } from '../constants/theme';
import { saveSetting } from '../db/settings';
import type { Language } from '../i18n';
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
  const { colors, t, language, setLanguage } = usePreferences();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0 && !saving;

  const finish = async () => {
    if (!canContinue) return;

    setSaving(true);
    await setLanguage(language);
    await saveSetting(db, 'userName', trimmedName);
    await saveSetting(db, 'onboardingDone', true);
    await askForNotifications();
    await syncReminders(db);
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

      <View style={styles.content}>
        <View style={styles.intro}>
          <AppLogo size={72} />
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
      </View>

      <View style={styles.footer}>
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
    </KeyboardAvoidingView>
  );
}

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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 32,
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
  hint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: 48 },
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