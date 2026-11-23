import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { LOCALES } from '../i18n';
import { formatTime } from '../lib/reminders';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';

type ReminderTimePickerProps = {
  label: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
};

const toDate = (hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

// Η ώρα των υπενθυμίσεων: πατάς την ώρα και ανοίγει ρολό, όπως στο ξυπνητήρι.
// Στο iPhone ανοίγει μέσα στη σελίδα, στο Android ως παράθυρο.
export const ReminderTimePicker = ({ label, hour, minute, onChange }: ReminderTimePickerProps) => {
  const styles = useStyles();
  const { colors, isDark, language } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setIsOpen(false);
    if (event.type === 'set' && date) onChange(date.getHours(), date.getMinutes());
  };

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => setIsOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatTime(hour, minute)}`}
          accessibilityState={{ expanded: isOpen }}
          style={({ pressed }) => [styles.value, isOpen && styles.valueOpen, pressed && styles.pressed]}
        >
          <Text style={[styles.valueText, isOpen && styles.valueTextOpen]}>
            {formatTime(hour, minute)}
          </Text>
        </Pressable>
      </View>

      {isOpen && Platform.OS === 'ios' && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <DateTimePicker
            value={toDate(hour, minute)}
            mode="time"
            display="spinner"
            locale={LOCALES[language]}
            themeVariant={isDark ? 'dark' : 'light'}
            textColor={colors.text}
            onChange={handleChange}
            style={styles.spinner}
          />
        </Animated.View>
      )}

      {isOpen && Platform.OS !== 'ios' && (
        <DateTimePicker value={toDate(hour, minute)} mode="time" is24Hour onChange={handleChange} />
      )}
    </Animated.View>
  );
};

const useStyles = createStyles((colors) => ({
  box: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  value: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
  },
  valueOpen: { backgroundColor: colors.text },
  valueText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  valueTextOpen: { color: colors.background },
  pressed: { opacity: 0.7 },
  spinner: { height: 180 },
}));
