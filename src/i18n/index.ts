import { getLocales } from 'expo-localization';
import { catalogStrings } from './catalog';
import { commonStrings } from './common';
import { homeStrings } from './home';
import { proStrings } from './pro';
import { screenStrings } from './screens';
import { settingsStrings } from './settings';
import { subscriptionStrings } from './subscription';

export type Language = 'el' | 'en';

export type Strings = Record<string, Record<Language, string>>;

const strings = {
  ...commonStrings,
  ...homeStrings,
  ...catalogStrings,
  ...subscriptionStrings,
  ...screenStrings,
  ...settingsStrings,
  ...proStrings,
};

export type StringKey = keyof typeof strings;

export type TranslateParams = Record<string, string | number>;

export type Translate = (key: StringKey, params?: TranslateParams) => string;

export const LOCALES: Record<Language, string> = {
  el: 'el-GR',
  en: 'en-GB',
};

export const getDeviceLanguage = (): Language =>
  getLocales()[0]?.languageCode === 'el' ? 'el' : 'en';

export const translate = (language: Language, key: StringKey, params?: TranslateParams) => {
  const template = strings[key][language];
  if (!params) return template;

  return Object.entries(params).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    template,
  );
};