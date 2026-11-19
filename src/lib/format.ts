import { LOCALES, type Language } from '../i18n';

const formatters = new Map<Language, Intl.NumberFormat>();

const getFormatter = (language: Language) => {
  const existing = formatters.get(language);
  if (existing) return existing;

  const formatter = new Intl.NumberFormat(LOCALES[language], {
    style: 'currency',
    currency: 'EUR',
  });
  formatters.set(language, formatter);
  return formatter;
};

export const formatEuro = (amount: number, language: Language = 'el') =>
  getFormatter(language).format(amount);

const HIDDEN_AMOUNT: Record<Language, string> = { el: '••• €', en: '€•••' };

export const formatMoney = (amount: number, language: Language = 'el', hidden = false) =>
  hidden ? HIDDEN_AMOUNT[language] : formatEuro(amount, language);