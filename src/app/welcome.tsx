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

  const finish = async (userName: string) => {
    setSaving(true);
    await saveSetting(db, 'userName', userName);
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
            onSubmitEditing={() => finish(name.trim())}
            accessibilityLabel="Το όνομά σου"
          />
          <Text style={styles.hint}>
            Όλα μένουν μόνο στο κινητό σου. Δεν χρειάζεται λογαριασμός.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => finish(name.trim())}
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, (pressed || saving) && styles.pressed]}
        >
          <Text style={styles.buttonText}>Ξεκίνα</Text>
        </Pressable>

        <Pressable
          onPress={() => finish('')}
          disabled={saving}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Text style={styles.skip}>Αργότερα</Text>
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
    paddingTop: 120,
    gap: spacing.xl,
  },
  intro: { gap: spacing.sm },
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    gap: spacing.md,
    alignItems: 'center',
  },
  button: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.onAccent, fontSize: 16, fontFamily: fonts.semibold },
  skip: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.medium },
});