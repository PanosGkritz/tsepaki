import type { Subscription } from '../types/subscription';
import { getCountedCost } from './share';

// Στις κοινές μετράει το δικό σου μερίδιο, εκτός αν ο χρήστης ζήτησε να μετράει όλο το ποσό.
export const monthlyCost = (subscription: Subscription, countFullShared = false) => {
  const cost = getCountedCost(subscription, countFullShared);
  return subscription.cycle === 'yearly' ? cost / 12 : cost;
};

export const getCostTotals = (subscriptions: Subscription[], countFullShared = false) => {
  const monthly = subscriptions.reduce(
    (sum, subscription) => sum + monthlyCost(subscription, countFullShared),
    0,
  );
  return { monthly, yearly: monthly * 12 };
};
