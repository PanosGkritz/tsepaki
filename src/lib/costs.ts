import type { Subscription } from '../types/subscription';

export const monthlyCost = (subscription: Subscription) =>
  subscription.cycle === 'yearly' ? subscription.price / 12 : subscription.price;

export const getCostTotals = (subscriptions: Subscription[]) => {
  const monthly = subscriptions.reduce((sum, subscription) => sum + monthlyCost(subscription), 0);
  return { monthly, yearly: monthly * 12 };
};