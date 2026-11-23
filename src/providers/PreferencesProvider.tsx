import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '../constants/theme';
import { loadCachedCatalogPrices } from '../db/catalogPrices';
import { getSettings, saveSetting } from '../db/settings';
import {
    getDeviceLanguage,
    translate,
    type Language,
    type StringKey,
    type Translate,
    type TranslateParams,
} from '../i18n';
import { getDeviceCurrency, type CurrencyCode } from '../lib/currency';
import { setActiveCurrency } from '../lib/format';
import { isProEnabled } from '../lib/pro';

type Preferences = {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  language: Language;
  hideAmounts: boolean;
  appLock: boolean;
  currency: CurrencyCode;
  countFullShared: boolean;
  isPro: boolean;
  t: Translate;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setHideAmounts: (hidden: boolean) => Promise<void>;
  setAppLock: (enabled: boolean) => Promise<void>;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setCountFullShared: (enabled: boolean) => Promise<void>;
  setDevPro: (enabled: boolean) => Promise<void>;
};

const PreferencesContext = createContext<Preferences | null>(null);

type PreferencesProviderProps = { children: React.ReactNode };

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage);
  const [hideAmounts, setHideAmountsState] = useState(false);
  const [appLock, setAppLockState] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>(getDeviceCurrency);
  const [countFullShared, setCountFullSharedState] = useState(false);
  const [devPro, setDevProState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings(db);
      await loadCachedCatalogPrices(db);
      setThemeModeState(settings.themeMode);
      if (settings.language) setLanguageState(settings.language);
      const savedCurrency = settings.currency ?? getDeviceCurrency();
      setActiveCurrency(savedCurrency);
      setCurrencyState(savedCurrency);
      setHideAmountsState(settings.hideAmounts);
      setAppLockState(settings.appLock);
      setCountFullSharedState(settings.countFullShared);
      setDevProState(settings.devPro);
      setReady(true);
    };
    load();
  }, [db]);

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';

  const value = useMemo<Preferences>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      themeMode,
      language,
      hideAmounts,
      appLock,
      currency,
      countFullShared,
      isPro: isProEnabled({ devPro }),
      t: (key: StringKey, params?: TranslateParams) => translate(language, key, params),
      setThemeMode: async (mode) => {
        setThemeModeState(mode);
        await saveSetting(db, 'themeMode', mode);
      },
      setLanguage: async (nextLanguage) => {
        setLanguageState(nextLanguage);
        await saveSetting(db, 'language', nextLanguage);
      },
      setHideAmounts: async (hidden) => {
        setHideAmountsState(hidden);
        await saveSetting(db, 'hideAmounts', hidden);
      },
      setAppLock: async (enabled) => {
        setAppLockState(enabled);
        await saveSetting(db, 'appLock', enabled);
      },
      setCurrency: async (nextCurrency) => {
        setActiveCurrency(nextCurrency);
        setCurrencyState(nextCurrency);
        await saveSetting(db, 'currency', nextCurrency);
      },
      setCountFullShared: async (enabled) => {
        setCountFullSharedState(enabled);
        await saveSetting(db, 'countFullShared', enabled);
      },
      setDevPro: async (enabled) => {
        setDevProState(enabled);
        await saveSetting(db, 'devPro', enabled);
      },
    }),
    [db, isDark, themeMode, language, hideAmounts, appLock, currency, countFullShared, devPro],
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