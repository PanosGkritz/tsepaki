import { LOCALES, type Language } from '../i18n';
import type { CurrencyCode } from './currency';

// Το νόμισμα που διάλεξε ο χρήστης. Το ορίζει το PreferencesProvider (και ο συγχρονισμός
// των ειδοποιήσεων), ώστε όλα τα ποσά της εφαρμογής να βγαίνουν στο ίδιο νόμισμα.
let activeCurrency: CurrencyCode = 'EUR';

export const setActiveCurrency = (currency: CurrencyCode) => {
  activeCurrency = currency;
};

export const getActiveCurrency = () => activeCurrency;

const formatters = new Map<string, Intl.NumberFormat>();

const getFormatter = (language: Language, currency: CurrencyCode) => {
  const key = `${language}-${currency}`;
  const existing = formatters.get(key);
  if (existing) return existing;

  const formatter = new Intl.NumberFormat(LOCALES[language], { style: 'currency', currency });
  formatters.set(key, formatter);
  return formatter;
};

// Το όνομα έμεινε από όταν η εφαρμογή είχε μόνο ευρώ: βγάζει το ποσό στο νόμισμα του χρήστη.
export const formatEuro = (amount: number, language: Language = 'el') =>
  getFormatter(language, activeCurrency).format(amount);

// «0,00 €» → «€», «CHF 0.00» → «CHF».
export const getCurrencySymbol = (language: Language = 'el') =>
  formatEuro(0, language).replace(/[\d.,\s  ]+/g, ' ').trim();

// «0,00 €» → «••• €», ώστε το κρυμμένο ποσό να κρατάει τη θέση του συμβόλου.
const hiddenAmount = (language: Language) =>
  formatEuro(0, language).replace(/\d[\d.,]*/, '•••');

export const formatMoney = (amount: number, language: Language = 'el', hidden = false) =>
  hidden ? hiddenAmount(language) : formatEuro(amount, language);
