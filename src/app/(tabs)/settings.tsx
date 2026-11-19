import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppLogo } from '../../components/AppLogo';
import { FEEDBACK_EMAIL, PLAY_STORE_URL, PRIVACY_POLICY_URL } from '../../constants/app';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { deleteAllData } from '../../db/maintenance';
import { DEFAULT_SETTINGS, getSettings, saveSetting, type AppSettings } from '../../db/settings';
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
import {
  REMINDER_DAY_OPTIONS,
  REMINDER_HOUR_OPTIONS,
  buildReminders,
  formatHour,
  syncReminders,
} from '../../lib/reminders';

const STATUS_LABEL: Record<PermissionState, string> = {
  granted: 'Ενεργές',
  denied: 'Απενεργοποιημένες',
  undetermined: 'Δεν έχουν ρυθμιστεί',
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const formatReminder = (reminder: Reminder) =>
  `${reminder.title} · ${formatChargeDay(toIsoDate(reminder.date))}, ${formatHour(reminder.date.getHours())}`;

export default function Settings() {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [nameDraft, setNameDraft] = useState('');
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [loadedSettings, subscriptions, permissionState, count] = await Promise.all([
      getSettings(db),
      getSubscriptions(db),
      getPermissionState(),
      getScheduledCount(),
    ]);

    setSettings(loadedSettings);
    setPermission(permissionState);
    setScheduledCount(count);
    setNextReminder(buildReminders(subscriptions, loadedSettings)[0] ?? null);
    return loadedSettings;
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh().then((loadedSettings) => setNameDraft(loadedSettings.userName));
    }, [refresh]),
  );

  const save = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    await saveSetting(db, key, value);
    await syncReminders(db);
    await refresh();
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(settings.userName);
      return;
    }
    if (trimmed !== settings.userName) save('userName', trimmed);
  };

  const toggleDay = (day: number) => {
    const days = settings.reminderDays.includes(day)
      ? settings.reminderDays.filter((item) => item !== day)
      : [...settings.reminderDays, day];
    save('reminderDays', days.sort((a, b) => b - a));
  };

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

  const confirmDeleteAll = () =>
    Alert.alert(
      'Διαγραφή όλων των δεδομένων',
      'Θα σβηστούν όλες οι συνδρομές και όλο το ιστορικό σου. Δεν γίνεται αναίρεση.',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Συνέχεια',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Σίγουρα;', 'Τελευταία ευκαιρία, μετά χάνονται όλα.', [
              { text: 'Άκυρο', style: 'cancel' },
              {
                text: 'Σβήσ’ τα όλα',
                style: 'destructive',
                onPress: async () => {
                  await deleteAllData(db);
                  await syncReminders(db);
                  await refresh();
                  setMessage(null);
                },
              },
            ]),
        },
      ],
    );

  const openFeedback = () =>
    Linking.openURL(
      `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`Τσεπάκι ${APP_VERSION} – σχόλια`)}`,
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Ρυθμίσεις</Text>

      <Section title="Εσύ">
        <Text style={styles.rowLabel}>Πώς να σε φωνάζω;</Text>
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          onEndEditing={saveName}
          placeholder="π.χ. Πάνο"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
          accessibilityLabel="Το όνομά σου"
        />
        <Text style={styles.hint}>Εμφανίζεται στον χαιρετισμό της αρχικής οθόνης.</Text>
      </Section>

      <Section title="Ειδοποιήσεις">
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Κατάσταση</Text>
          <Text style={[styles.rowValue, permission === 'granted' && styles.rowValueOn]}>
            {STATUS_LABEL[permission]}
          </Text>
        </View>

        <Text style={styles.rowLabel}>Πότε να σου θυμίζω</Text>
        <View style={styles.chips}>
          {REMINDER_DAY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              isActive={settings.reminderDays.includes(option.value)}
              onPress={() => toggleDay(option.value)}
            />
          ))}
        </View>

        <Text style={styles.rowLabel}>Τι ώρα</Text>
        <View style={styles.chips}>
          {REMINDER_HOUR_OPTIONS.map((hour) => (
            <Chip
              key={hour}
              label={formatHour(hour)}
              isActive={settings.reminderHour === hour}
              onPress={() => save('reminderHour', hour)}
            />
          ))}
        </View>

        <View style={styles.row}>
          <Text style={[styles.rowLabel, styles.flex]}>Ετήσιες συνδρομές: μία εβδομάδα πριν</Text>
          <Switch
            value={settings.yearlyReminder}
            onValueChange={(value) => save('yearlyReminder', value)}
            trackColor={{ true: colors.accent, false: colors.surfaceRaised }}
            thumbColor={colors.text}
          />
        </View>

        {settings.reminderDays.length === 0 && (
          <Text style={styles.warning}>Δεν έχεις διαλέξει μέρα, οπότε δεν θα σου έρχονται υπενθυμίσεις.</Text>
        )}

        <View style={styles.divider} />

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

        {message && <Text style={styles.hint}>{message}</Text>}
      </Section>

      {(FEEDBACK_EMAIL || PLAY_STORE_URL) && (
        <Section title="Επικοινωνία">
          {FEEDBACK_EMAIL ? (
            <LinkRow label="Στείλε μας τη γνώμη σου" onPress={openFeedback} />
          ) : null}
          {PLAY_STORE_URL ? (
            <LinkRow label="Βαθμολόγησέ μας" onPress={() => Linking.openURL(PLAY_STORE_URL)} />
          ) : null}
        </Section>
      )}

      <Section title="Δεδομένα">
        <Pressable
          onPress={confirmDeleteAll}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Διαγραφή όλων των δεδομένων</Text>
        </Pressable>
        <Text style={styles.hint}>Σβήνει όλες τις συνδρομές και το ιστορικό σου.</Text>
      </Section>

      <Section title="Σχετικά">
        <View style={styles.about}>
          <AppLogo size={64} />
          <View style={styles.aboutText}>
            <Text style={styles.appName}>Τσεπάκι</Text>
            <Text style={styles.rowValue}>Έκδοση {APP_VERSION}</Text>
          </View>
          <Text style={styles.tagline}>Σου θυμίζω κάθε χρέωση πριν φύγουν τα λεφτά.</Text>
          <Text style={styles.maker}>Φτιαγμένο στην Ελλάδα από τον PG</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.hint}>
          Όλα τα δεδομένα σου μένουν μόνο σε αυτό το κινητό. Δεν συνδεόμαστε με τράπεζα και δεν
          στέλνουμε τίποτα σε server.
        </Text>

        {PRIVACY_POLICY_URL ? (
          <LinkRow label="Πολιτική απορρήτου" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
        ) : null}

        <Text style={styles.legal}>
          Τα λογότυπα και τα ονόματα των υπηρεσιών ανήκουν στους κατόχους τους και χρησιμοποιούνται
          μόνο για να αναγνωρίζεις τις συνδρομές σου. Τα λογότυπα παρέχονται από το Brandfetch, στο
          οποίο στέλνεται μόνο το όνομα του site της υπηρεσίας.
        </Text>
      </Section>
    </ScrollView>
  );
}

type SectionProps = { title: string; children: React.ReactNode };

const Section = ({ title, children }: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

type ChipProps = { label: string; isActive: boolean; onPress: () => void };

const Chip = ({ label, isActive, onPress }: ChipProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
    style={[styles.chip, isActive && styles.chipActive]}
  >
    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

type LinkRowProps = { label: string; onPress: () => void };

const LinkRow = ({ label, onPress }: LinkRowProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="link"
    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
  >
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  next: { gap: 2 },
  rowLabel: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  rowValue: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
  rowValueOn: { color: colors.accentBright },
  preview: { color: colors.text, fontSize: 14, fontFamily: fonts.regular, marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 },
  legal: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular, lineHeight: 17 },
  warning: { color: colors.warning, fontSize: 13, fontFamily: fonts.medium },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  about: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  aboutText: { alignItems: 'center', gap: 2 },
  appName: { color: colors.text, fontSize: 22, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  tagline: { color: colors.text, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  maker: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  chipTextActive: { color: colors.background },
  button: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: colors.onAccent, fontSize: 15, fontFamily: fonts.semibold },
  deleteText: { color: colors.warning, fontSize: 15, fontFamily: fonts.medium },
  link: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.medium },
  chevron: { color: colors.textMuted, fontSize: 22, fontFamily: fonts.regular },
});