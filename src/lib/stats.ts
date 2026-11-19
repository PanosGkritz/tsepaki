import type { Language } from '../i18n';
import type { Subscription } from '../types/subscription';
import {
  getMonthEnd,
  getMonthStart,
  getUpcomingItems,
  shiftMonth,
  type CalendarItem,
} from './calendar';
import { monthlyCost } from './costs';
import { toIsoDate } from './dates';
import { getMonthLabel } from './summary';

const MONTH_SHORT: Record<Language, string[]> = {
  el: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#E5484D',
  music: '#30A46C',
  gaming: '#3E63DD',
  ai: '#D97757',
  storage: '#12A594',
  mobile: '#D6409F',
  tv: '#F5A35C',
  activities: '#E8590C',
  other: '#8B8D98',
};

const FALLBACK_COLOR = '#8B8D98';

export type MonthTotal = {
  key: string;
  date: Date;
  shortLabel: string;
  total: number;
  isCurrent: boolean;
};

export type CategoryShare = {
  category: string;
  amount: number;
  share: number;
  color: string;
};

const sumAmounts = (items: CalendarItem[]) => items.reduce((sum, item) => sum + item.amount, 0);

export const getMonthName = (date: Date, language: Language = 'el') =>
  getMonthLabel(date, language).split(' ')[0];

export const toAccusative = (monthName: string) => monthName.slice(0, -1);

export const getMonthlyTotals = (
  charges: CalendarItem[],
  subscriptions: Subscription[],
  count = 6,
  today = new Date(),
  language: Language = 'el',
): MonthTotal[] => {
  const currentStart = getMonthStart(today);
  const upcomingThisMonth = getUpcomingItems(
    subscriptions,
    toIsoDate(today),
    toIsoDate(getMonthEnd(currentStart)),
  );

  return Array.from({ length: count }, (_, index) => {
    const date = shiftMonth(currentStart, index - (count - 1));
    const key = toIsoDate(date).slice(0, 7);
    const isCurrent = index === count - 1;
    const paid = sumAmounts(charges.filter((item) => item.date.startsWith(key)));
    const upcoming = isCurrent ? sumAmounts(upcomingThisMonth) : 0;

    return {
      key,
      date,
      shortLabel: MONTH_SHORT[language][date.getMonth()],
      total: paid + upcoming,
      isCurrent,
    };
  });
};

export const getCategoryBreakdown = (subscriptions: Subscription[]): CategoryShare[] => {
  const totals = new Map<string, number>();
  for (const subscription of subscriptions) {
    const current = totals.get(subscription.category) ?? 0;
    totals.set(subscription.category, current + monthlyCost(subscription));
  }

  const grandTotal = [...totals.values()].reduce((sum, amount) => sum + amount, 0);

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: grandTotal > 0 ? amount / grandTotal : 0,
      color: CATEGORY_COLORS[category] ?? FALLBACK_COLOR,
    }))
    .sort((a, b) => b.amount - a.amount);
};