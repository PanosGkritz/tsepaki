import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getSubscriptions } from '../../db/subscriptions';
import { formatChargeDay, toIsoDate } from '../../lib/dates';
import {
    getPermissionState,
    getScheduledCount,
    requestPermission,
    sendTestNotification,
    type PermissionState,
    type Reminder,
} from '../../lib/notifications';
import { REMINDER_SUMMARY, buildReminders, syncReminders } from '../../lib/reminders';

const STATUS_LABEL: Record<PermissionState, string> = {
  granted: 'Ενεργές',
  denied: 'Απενεργοποιημένες',
  undetermined: 'Δεν έχουν ρυθμιστεί',
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatReminder = (reminder: Reminder) =>
  `${reminder.title} · ${formatChargeDay(toIsoDate(reminder.date))}, ${pad(reminder.date.getHours())}:${pad(reminder.date.getMinutes())}`;

export default function Settings() {
  const db = useSQLiteContext();
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPermission(await getPermissionState());
    setScheduledCount(await getScheduledCount());
    const subscriptions = await getSubscriptions(db);
    setNextReminder(buildReminders(subscriptions)[0] ?? null);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleTest = async () => {
    const state = await requestPermission();
    setPermission(state);

    if (state !== 'granted') {
      setMessage('Χωρίς άδεια δεν μπορώ να σου στείλω ειδοποιήσεις.');
      return;
    }

    await syncReminders(db);
    await sendTestNotification();
    await refresh();
    setMessage('Έρχεται σε 5 δευτερόλεπτα.');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ρυθμίσεις</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ειδοποιήσεις</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Κατάσταση</Text>
            <Text style={[styles.rowValue, permission === 'granted' && styles.rowValueOn]}>
              {STATUS_LABEL[permission]}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Προγραμματισμένες</Text>
            <Text style={styles.rowValue}>{scheduledCount}</Text>
          </View>

          {nextReminder && (
            <View style={styles.next}>
              <Text style={styles.rowLabel}>Επόμενη υπενθύμιση</Text>
              <Text style={styles.rowValue}>{formatReminder(nextReminder)}</Text>
              <Text style={styles.preview}>«{nextReminder.body}»</Text>
            </View>
          )}

          <Text style={styles.hint}>{REMINDER_SUMMARY}</Text>

          <Pressable
            onPress={handleTest}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Στείλε μια δοκιμαστική</Text>
          </Pressable>

          {permission === 'denied' && (
            <Pressable onPress={() => Linking.openSettings()} accessibilityRole="link">
              <Text style={styles.link}>Άνοιξε τις ρυθμίσεις του κινητού</Text>
            </Pressable>
          )}

          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 80, paddingBottom: spacing.xl, gap: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  next: { gap: 2 },
  rowLabel: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  rowValue: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
  rowValueOn: { color: colors.accentBright },
  preview: { color: colors.text, fontSize: 14, fontFamily: fonts.regular, marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 },
  button: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.onAccent, fontSize: 15, fontFamily: fonts.semibold },
  link: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.medium },
  message: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
});