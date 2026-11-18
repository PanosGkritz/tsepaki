const WEEKDAYS = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

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

export const formatChargeDay = (iso: string) => {
  const date = parseIsoDate(iso);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
};

export const formatFullDate = (date: Date) =>
  `${WEEKDAYS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

export const formatRelativeDays = (days: number) => {
  if (days === 0) return 'σήμερα';
  if (days === 1) return 'αύριο';
  return `σε ${days} μέρες`;
};