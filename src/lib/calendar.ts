import type { Language } from '../i18n';
import type { Subscription } from '../types/subscription';
import { addCycle, toIsoDate } from './dates';

export type CalendarItem = {
  key: string;
  subscription: Subscription;
  date: string;
  amount: number;
  status: 'paid' | 'upcoming';
};

export const WEEKDAY_SHORT: Record<Language, string[]> = {
  el: ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

export const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const shiftMonth = (monthStart: Date, delta: number) =>
  new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1);

export const getMonthEnd = (monthStart: Date) =>
  new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

export const buildMonthCells = (monthStart: Date) => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const leadingBlanks = (monthStart.getDay() + 6) % 7;
  const daysInMonth = getMonthEnd(monthStart).getDate();

  const cells: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toIsoDate(new Date(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
};

export const getUpcomingItems = (
  subscriptions: Subscription[],
  fromIso: string,
  toIso: string,
): CalendarItem[] =>
  subscriptions.flatMap((subscription) => {
    const items: CalendarItem[] = [];
    let date = subscription.nextChargeDate;

    while (date <= toIso) {
      if (date >= fromIso) {
        items.push({
          key: `${subscription.id}-${date}`,
          subscription,
          date,
          amount: subscription.price,
          status: 'upcoming',
        });
      }
      date = addCycle(date, subscription.cycle);
    }

    return items;
  });

export const groupByDate = (items: CalendarItem[]) => {
  const groups = new Map<string, CalendarItem[]>();
  for (const item of items) {
    groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  }
  return groups;
};