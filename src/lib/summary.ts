import type { Subscription } from '../types/subscription';
import { toIsoDate } from './dates';

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

export const getMonthLabel = (date = new Date()) =>
  `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export const getMonthRange = (date = new Date()) => ({
  from: toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)),
  to: toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});

export const getMonthSummary = (subscriptions: Subscription[], paid: number, date = new Date()) => {
  const { from, to } = getMonthRange(date);

  const remaining = subscriptions
    .filter((subscription) => subscription.nextChargeDate >= from && subscription.nextChargeDate <= to)
    .reduce((sum, subscription) => sum + subscription.price, 0);

  return {
    total: paid + remaining,
    paid,
    remaining,
    count: subscriptions.length,
  };
};