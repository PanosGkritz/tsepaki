import type { Subscription } from '../types/subscription';
import type { CalendarItem } from './calendar';
import { parseIsoDate, toIsoDate } from './dates';
import { getSavedThisYear } from './review';

// Η χρονιά σου σε συνδρομές (Pro): όλα βγαίνουν από τις χρεώσεις που έχουν καταγραφεί φέτος.

export type WrappedTop = {
  subscription: Subscription;
  amount: number;
  count: number;
};

export type WrappedCategory = { category: string; amount: number; share: number };

export type WrappedMonth = { month: number; amount: number };

export type WrappedStats = {
  year: number;
  total: number;
  chargeCount: number;
  perDay: number;
  top: WrappedTop | null;
  categories: WrappedCategory[];
  busiestMonth: WrappedMonth | null;
  activeCount: number;
  addedThisYear: number;
  cancelledThisYear: number;
  saved: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

const dayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1;
};

export const getWrappedStats = (
  charges: CalendarItem[],
  subscriptions: Subscription[],
  cancelled: (Subscription & { cancelledAt: string })[],
  today = new Date(),
): WrappedStats => {
  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const todayIso = toIsoDate(today);
  const thisYear = charges.filter((item) => item.date >= yearStart && item.date <= todayIso);

  const total = thisYear.reduce((sum, item) => sum + item.amount, 0);

  const bySubscription = new Map<string, WrappedTop>();
  const byCategory = new Map<string, number>();
  const byMonth = new Map<number, number>();

  for (const item of thisYear) {
    const current = bySubscription.get(item.subscription.id);
    bySubscription.set(item.subscription.id, {
      subscription: current?.subscription ?? item.subscription,
      amount: (current?.amount ?? 0) + item.amount,
      count: (current?.count ?? 0) + 1,
    });

    const category = item.subscription.category;
    byCategory.set(category, (byCategory.get(category) ?? 0) + item.amount);

    const month = parseIsoDate(item.date).getMonth();
    byMonth.set(month, (byMonth.get(month) ?? 0) + item.amount);
  }

  const top = [...bySubscription.values()].sort((a, b) => b.amount - a.amount)[0] ?? null;

  const categories = [...byCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount: round(amount),
      share: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const busiestEntry = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];

  const activeCount = subscriptions.length;
  const addedThisYear = [...subscriptions, ...cancelled].filter(
    (subscription) => subscription.createdAt !== undefined && subscription.createdAt >= yearStart,
  ).length;
  const cancelledThisYear = cancelled.filter(
    (subscription) => subscription.cancelledAt >= yearStart,
  ).length;

  return {
    year,
    total: round(total),
    chargeCount: thisYear.length,
    perDay: round(total / dayOfYear(today)),
    top: top ? { ...top, amount: round(top.amount) } : null,
    categories,
    busiestMonth: busiestEntry ? { month: busiestEntry[0], amount: round(busiestEntry[1]) } : null,
    activeCount,
    addedThisYear,
    cancelledThisYear,
    saved: round(getSavedThisYear(cancelled, today)),
  };
};
