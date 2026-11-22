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
import { fonts, radius, spacing, type ThemeMode } from '../../constants/theme';
import { deleteAllData } from '../../db/maintenance';
import { DEFAULT_SETTINGS, getSettings, saveSetting, type AppSettings } from '../../db/settings';
import { getSubscriptions } from '../../db/subscriptions';
import type { Language, StringKey } from '../../i18n';
import {
  InvalidBackupError,
  NewerBackupError,
  exportBackup,
  pickBackup,
  restoreBackup,
  type BackupSummary,
} from '../../lib/backup';
import { formatChargeDay, toIsoDate } from '../../lib/dates';
import { notifyDataChanged } from '../../lib/events';
import { authenticate, canUseLock } from '../../lib/lock';
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
import { createStyles } from '../../lib/styles';
import { usePreferences } from '../../providers/PreferencesProvider';

const STATUS_KEYS: Record<PermissionState, StringKey> = {
  granted: 'settings.status.granted',
  denied: 'settings.status.denied',
  undetermined: 'settings.status.undetermined',
};

const DAY_KEYS: Record<number, StringKey> = {
  3: 'settings.day.3',
  2: 'settings.day.2',
  1: 'settings.day.1',
  0: 'settings.day.0',
};

const THEME_OPTIONS: { value: ThemeMode; key: StringKey }[] = [
  { value: 'system', key: 'settings.theme.system' },
  { value: 'dark', key: 'settings.theme.dark' },
  { value: 'light', key: 'settings.theme.light' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'el', label: 'Ελληνικά' },
  { value: 'en', label: 'English' },
];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const formatReminder = (reminder: Reminder, language: Language) =>
  `${reminder.title} · ${formatChargeDay(toIsoDate(reminder.date), language)}, ${formatHour(reminder.date.getHours())}`;

export default function Settings() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const {
    colors,
    t,
    themeMode,
    language,
    appLock,
    setThemeMode,
    setLanguage,
    setHideAmounts,
    setAppLock,
  } = usePreferences();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [nameDraft, setNameDraft] = useState('');
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [message, setMessage] = useState<StringKey | null>(null);

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

  const changeLanguage = async (nextLanguage: Language) => {
    await setLanguage(nextLanguage);
    await syncReminders(db);
    await refresh();
  };

  const toggleAppLock = async (enabled: boolean) => {
    if (!enabled) {
      await setAppLock(false);
      return;
    }

    if (!(await canUseLock())) {
      Alert.alert(t('lock.unavailableTitle'), t('lock.unavailable'));
      return;
    }

    if (await authenticate(t('lock.confirm'), t('common.cancel'))) await setAppLock(true);
  };

  const handleTest = async () => {
    const state = await requestPermission();
    setPermission(state);

    if (state !== 'granted') {
      setMessage('settings.noPermission');
      return;
    }

    await syncReminders(db);
    await sendTestNotification(language);
    await refresh();
    setMessage('settings.testComing');
  };

  const confirmDeleteAll = () =>
    Alert.alert(t('settings.deleteAll'), t('settings.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('settings.deleteSure'), t('settings.deleteLastChance'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('settings.deleteEverything'),
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
    ]);

  const handleExport = async () => {
    try {
      await exportBackup(db, t('settings.backupShareTitle'));
    } catch {
      Alert.alert(t('settings.backupFailed'));
    }
  };

  const restore = async ({ backup }: BackupSummary) => {
    try {
      await restoreBackup(db, backup);
      const restored = await getSettings(db);
      await setThemeMode(restored.themeMode);
      if (restored.language) await setLanguage(restored.language);
      await setHideAmounts(restored.hideAmounts);
      await syncReminders(db);
      notifyDataChanged();
      const loadedSettings = await refresh();
      setNameDraft(loadedSettings.userName);
      Alert.alert(t('settings.restoreDone'));
    } catch {
      Alert.alert(t('settings.backupFailed'));
    }
  };

  const handleImport = async () => {
    let summary: BackupSummary | null;
    try {
      summary = await pickBackup();
    } catch (error) {
      if (error instanceof NewerBackupError) {
        Alert.alert(t('settings.backupInvalidTitle'), t('settings.backupNewer'));
      } else if (error instanceof InvalidBackupError) {
        Alert.alert(t('settings.backupInvalidTitle'), t('settings.backupInvalid'));
      } else {
        Alert.alert(t('settings.backupFailed'));
      }
      return;
    }
    if (!summary) return;

    const exportedAt = new Date(summary.backup.exportedAt);
    const date = Number.isNaN(exportedAt.getTime())
      ? '–'
      : `${exportedAt.getDate()}/${exportedAt.getMonth() + 1}/${exportedAt.getFullYear()}`;
    const chosen = summary;

    Alert.alert(
      t('settings.restoreTitle'),
      t('settings.restoreMessage', {
        date,
        subscriptions: chosen.activeCount,
        charges: chosen.chargeCount,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.restoreConfirm'), style: 'destructive', onPress: () => restore(chosen) },
      ],
    );
  };

  const openFeedback = () =>
    Linking.openURL(
      `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t('settings.feedbackSubject', { version: APP_VERSION }))}`,
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('settings.title')}</Text>

      <Section title={t('settings.you')}>
        <Text style={styles.rowLabel}>{t('settings.nameLabel')}</Text>
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          onEndEditing={saveName}
          placeholder={t('settings.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
          accessibilityLabel={t('settings.nameLabel')}
        />
        <Text style={styles.hint}>{t('settings.nameHint')}</Text>
      </Section>

      <Section title={t('settings.appearance')}>
        <View style={styles.chips}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={t(option.key)}
              isActive={themeMode === option.value}
              onPress={() => setThemeMode(option.value)}
            />
          ))}
        </View>
        <Text style={styles.hint}>{t('settings.themeHint')}</Text>
      </Section>

      <Section title={t('settings.language')}>
        <View style={styles.chips}>
          {LANGUAGE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              isActive={language === option.value}
              onPress={() => changeLanguage(option.value)}
            />
          ))}
        </View>
      </Section>

      <Section title={t('settings.security')}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, styles.flex]}>{t('settings.appLock')}</Text>
          <Switch
            value={appLock}
            onValueChange={toggleAppLock}
            trackColor={{ true: colors.accent, false: colors.surfaceRaised }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Text style={styles.hint}>{t('settings.appLockHint')}</Text>
      </Section>

      <Section title={t('settings.notifications')}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.status')}</Text>
          <Text style={[styles.rowValue, permission === 'granted' && styles.rowValueOn]}>
            {t(STATUS_KEYS[permission])}
          </Text>
        </View>

        <Text style={styles.rowLabel}>{t('settings.when')}</Text>
        <View style={styles.chips}>
          {REMINDER_DAY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={t(DAY_KEYS[option.value])}
              isActive={settings.reminderDays.includes(option.value)}
              onPress={() => toggleDay(option.value)}
            />
          ))}
        </View>

        <Text style={styles.rowLabel}>{t('settings.time')}</Text>
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
          <Text style={[styles.rowLabel, styles.flex]}>{t('settings.yearly')}</Text>
          <Switch
            value={settings.yearlyReminder}
            onValueChange={(value) => save('yearlyReminder', value)}
            trackColor={{ true: colors.accent, false: colors.surfaceRaised }}
            thumbColor="#FFFFFF"
          />
        </View>

        {settings.reminderDays.length === 0 && (
          <Text style={styles.warning}>{t('settings.noDays')}</Text>
        )}

        {/* Μόνο για τον developer: φαίνεται στο Expo Go, κρύβεται στην εφαρμογή του store. */}
        {__DEV__ && (
          <>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('settings.scheduled')}</Text>
              <Text style={styles.rowValue}>{scheduledCount}</Text>
            </View>

            {nextReminder && (
              <View style={styles.next}>
                <Text style={styles.rowLabel}>{t('settings.nextReminder')}</Text>
                <Text style={styles.rowValue}>{formatReminder(nextReminder, language)}</Text>
                <Text style={styles.preview}>
                  {language === 'el' ? `«${nextReminder.body}»` : `“${nextReminder.body}”`}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleTest}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>{t('settings.sendTest')}</Text>
            </Pressable>
          </>
        )}

        {permission === 'denied' && (
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="link">
            <Text style={styles.link}>{t('settings.openPhoneSettings')}</Text>
          </Pressable>
        )}

        {message && <Text style={styles.hint}>{t(message)}</Text>}
      </Section>

      {(FEEDBACK_EMAIL || PLAY_STORE_URL) && (
        <Section title={t('settings.contact')}>
          {FEEDBACK_EMAIL ? <LinkRow label={t('settings.feedback')} onPress={openFeedback} /> : null}
          {PLAY_STORE_URL ? (
            <LinkRow label={t('settings.rate')} onPress={() => Linking.openURL(PLAY_STORE_URL)} />
          ) : null}
        </Section>
      )}

      <Section title={t('settings.data')}>
        <Pressable
          onPress={handleExport}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{t('settings.exportBackup')}</Text>
        </Pressable>
        <Pressable
          onPress={handleImport}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{t('settings.importBackup')}</Text>
        </Pressable>
        <Text style={styles.hint}>{t('settings.backupHint')}</Text>

        <View style={styles.divider} />

        <Pressable
          onPress={confirmDeleteAll}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>{t('settings.deleteAll')}</Text>
        </Pressable>
        <Text style={styles.hint}>{t('settings.deleteHint')}</Text>
      </Section>

      <Section title={t('settings.about')}>
        <View style={styles.about}>
          <AppLogo size={64} />
          <View style={styles.aboutText}>
            <Text style={styles.appName}>{t('common.appName')}</Text>
            <Text style={styles.rowValue}>{t('settings.version', { version: APP_VERSION })}</Text>
          </View>
          <Text style={styles.tagline}>{t('settings.tagline')}</Text>
          <Text style={styles.maker}>{t('settings.maker')}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.hint}>{t('settings.privacy')}</Text>

        {PRIVACY_POLICY_URL ? (
          <LinkRow
            label={t('settings.privacyPolicy')}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          />
        ) : null}

        <Text style={styles.legal}>{t('settings.legal')}</Text>
      </Section>
    </ScrollView>
  );
}

type SectionProps = { title: string; children: React.ReactNode };

const Section = ({ title, children }: SectionProps) => {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
};

type ChipProps = { label: string; isActive: boolean; onPress: () => void };

const Chip = ({ label, isActive, onPress }: ChipProps) => {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[styles.chip, isActive && styles.chipActive]}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
};

type LinkRowProps = { label: string; onPress: () => void };

const LinkRow = ({ label, onPress }: LinkRowProps) => {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
};

const useStyles = createStyles((colors) => ({
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
  secondaryText: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  deleteText: { color: colors.warning, fontSize: 15, fontFamily: fonts.medium },
  link: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.medium },
  chevron: { color: colors.textMuted, fontSize: 22, fontFamily: fonts.regular },
}));