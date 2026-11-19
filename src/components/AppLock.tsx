import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, Text, View, type AppStateStatus } from 'react-native';
import { fonts, radius, spacing } from '../constants/theme';
import { authenticate } from '../lib/lock';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import { AppLogo } from './AppLogo';

type AppLockProps = { children: React.ReactNode };

export const AppLock = ({ children }: AppLockProps) => {
  const styles = useStyles();
  const { colors, t, appLock } = usePreferences();
  const [locked, setLocked] = useState(appLock);
  const lockedRef = useRef(appLock);
  const busyRef = useRef(false);
  const lastStateRef = useRef<AppStateStatus>(AppState.currentState);

  const unlock = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const success = await authenticate(t('lock.prompt'), t('common.cancel'));
    busyRef.current = false;

    if (success) {
      lockedRef.current = false;
      setLocked(false);
    }
  }, [t]);

  // Μόλις ανοίξει η εφαρμογή, ζητάμε αμέσως ξεκλείδωμα.
  useEffect(() => {
    if (lockedRef.current) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!appLock) {
      lockedRef.current = false;
      setLocked(false);
      return;
    }

    const listener = AppState.addEventListener('change', (state) => {
      const previous = lastStateRef.current;
      lastStateRef.current = state;

      // Κλειδώνει μόνο όταν η εφαρμογή πάει στο παρασκήνιο.
      // Το «inactive» το προκαλεί και το ίδιο το Face ID, οπότε το αγνοούμε.
      if (state === 'background') {
        lockedRef.current = true;
        setLocked(true);
      }

      if (state === 'active' && previous === 'background' && lockedRef.current) unlock();
    });

    return () => listener.remove();
  }, [appLock, unlock]);

  return (
    <>
      {children}
      <Modal visible={appLock && locked} animationType="fade" statusBarTranslucent>
        <View style={styles.screen}>
          <AppLogo size={72} />
          <Text style={styles.title}>{t('lock.title')}</Text>

          <Pressable
            onPress={unlock}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Ionicons name="lock-open-outline" size={18} color={colors.onAccent} />
            <Text style={styles.buttonText}>{t('lock.unlock')}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

const useStyles = createStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  title: { color: colors.text, fontSize: 18, fontFamily: fonts.medium, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.onAccent, fontSize: 15, fontFamily: fonts.semibold },
}));
