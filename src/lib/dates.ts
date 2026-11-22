import type { Language } from '../i18n';
import type { BillingCycle } from '../types/subscription';

const WEEKDAYS: Record<Language, string[]> = {
  el: ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const RELATIVE: Record<Language, { today: string; tomorrow: string; inDays: string }> = {
  el: { today: 'σήμερα', tomorrow: 'αύριο', inDays: 'σε {days} μέρες' },
  en: { today: 'today', tomorrow: 'tomorrow', inDays: 'in {days} days' },
};

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

export const parseIsoDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const daysUntil = (iso: string, today = new Date()) =>
  Math.round((parseIsoDate(iso).getTime() - startOfDay(today).getTime()) / DAY_MS);

export const addCycle = (iso: string, cycle: BillingCycle) =>
  addMonths(iso, cycle === 'yearly' ? 12 : 1);

// Ίδια μέρα μετά από Χ μήνες. Αν ο μήνας είναι μικρότερος, η τελευταία του μέρα (31/1 → 28/2).
export const addMonths = (iso: string, months: number) => {
  const date = parseIsoDate(iso);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDayOfMonth));
  return toIsoDate(target);
};

export const formatChargeDay = (iso: string, language: Language = 'el') => {
  const date = parseIsoDate(iso);
  return `${WEEKDAYS[language][date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
};

export const formatFullDate = (date: Date, language: Language = 'el') =>
  `${WEEKDAYS[language][date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

export const formatRelativeDays = (days: number, language: Language = 'el') => {
  const words = RELATIVE[language];
  if (days === 0) return words.today;
  if (days === 1) return words.tomorrow;
  return words.inDays.replace('{days}', String(days));
};