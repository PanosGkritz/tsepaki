import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { saveSetting } from '../db/settings';
import { requestPermission } from '../lib/notifications';
import { syncReminders } from '../lib/reminders';

const askForNotifications = async () => {
  try {
    await requestPermission();
  } catch {
    // Αν δεν δοθεί άδεια, ο χρήστης μπορεί να την ενεργοποιήσει αργότερα από τις Ρυθμίσεις.
  }
};

export default function Welcome() {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0 && !saving;

  const finish = async () => {
    if (!canContinue) return;

    setSaving(true);
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
      <View style={styles.content}>
        <View style={styles.intro}>
          <AppLogo size={72} />
          <Text style={styles.title}>Καλώς ήρθες στο Τσεπάκι</Text>
          <Text style={styles.subtitle}>
            Σου θυμίζω κάθε χρέωση πριν φύγουν τα λεφτά, για να μη μείνεις ποτέ ταπί.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Πώς να σε φωνάζω;</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="π.χ. Πάνο"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={finish}
            accessibilityLabel="Το όνομά σου"
          />
          <Text style={styles.hint}>
            Όλα μένουν μόνο στο κινητό σου. Δεν χρειάζεται λογαριασμός.
          </Text>
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
          <Text style={styles.buttonText}>Ξεκίνα</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 100,
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
});