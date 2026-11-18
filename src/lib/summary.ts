import type { Subscription } from '../types/subscription';
import { parseIsoDate } from './dates';

const MONTHS = [
  'Ιανουάριος',
  'Φεβρουάριος',
  'Μάρτιος',
  'Απρίλιος',
  'Μάιος',
  'Ιούνιος',
  'Ιούλιος',
  'Αύγουστος',
  'Σεπτέμβριος',
  'Οκτώβριος',
  'Νοέμβριος',
  'Δεκέμβριος',
];

export const getMonthLabel = (today = new Date()) => MONTHS[today.getMonth()];

const isSameMonth = (date: Date, today: Date) =>
  date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();

export const getMonthSummary = (subscriptions: Subscription[], today = new Date()) => {
  let total = 0;
  let remaining = 0;

  for (const subscription of subscriptions) {
    const nextCharge = parseIsoDate(subscription.nextChargeDate);
    const chargesThisMonth = subscription.cycle === 'monthly' || isSameMonth(nextCharge, today);

    if (!chargesThisMonth) continue;

    total += subscription.price;
    if (isSameMonth(nextCharge, today)) remaining += subscription.price;
  }

  return { total, paid: total - remaining, count: subscriptions.length };
};
