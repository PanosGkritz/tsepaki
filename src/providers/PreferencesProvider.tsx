import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '../constants/theme';
import { getSettings, saveSetting } from '../db/settings';
import {
    getDeviceLanguage,
    translate,
    type Language,
    type StringKey,
    type Translate,
    type TranslateParams,
} from '../i18n';

type Preferences = {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  language: Language;
  t: Translate;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
};

const PreferencesContext = createContext<Preferences | null>(null);

type PreferencesProviderProps = { children: React.ReactNode };

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSettings(db).then((settings) => {
      setThemeModeState(settings.themeMode);
      if (settings.language) setLanguageState(settings.language);
      setReady(true);
    });
  }, [db]);

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';

  const value = useMemo<Preferences>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      themeMode,
      language,
      t: (key: StringKey, params?: TranslateParams) => translate(language, key, params),
      setThemeMode: async (mode) => {
        setThemeModeState(mode);
        await saveSetting(db, 'themeMode', mode);
      },
      setLanguage: async (nextLanguage) => {
        setLanguageState(nextLanguage);
        await saveSetting(db, 'language', nextLanguage);
      },
    }),
    [db, isDark, themeMode, language],
  );

  if (!ready) {
    const background = (systemScheme === 'light' ? lightColors : darkColors).background;
    return <View style={{ flex: 1, backgroundColor: background }} />;
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('usePreferences must be used inside PreferencesProvider');
  return preferences;
};

export const useTheme = () => usePreferences().colors;

export const useT = () => usePreferences().t;