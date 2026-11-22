import type { Subscription } from '../types/subscription';
import { monthlyCost } from './costs';
import { addCycle, addMonths, toIsoDate } from './dates';
import { getMyCost } from './share';

export const REVIEW_AFTER_MONTHS = 4;

// Πότε κάνουμε την ερώτηση: 4 μήνες μετά την προσθήκη, και μετά 4 μήνες μετά από κάθε «Ναι».
const getReviewDate = (subscription: Subscription) => {
  if (subscription.reviewAfter) return subscription.reviewAfter;
  if (!subscription.createdAt) return null;
  return addMonths(subscription.createdAt, REVIEW_AFTER_MONTHS);
};

// Μία κάρτα τη φορά: η πιο ακριβή (σε μηνιαίο κόστος) από όσες είναι ώρα να ρωτήσουμε.
export const pickReviewCandidate = (subscriptions: Subscription[], today = new Date()) => {
  const todayIso = toIsoDate(today);

  return subscriptions
    .filter((subscription) => {
      if (subscription.isTrial) return false;
      const reviewDate = getReviewDate(subscription);
      return reviewDate !== null && reviewDate <= todayIso;
    })
    .sort((a, b) => monthlyCost(b) - monthlyCost(a))[0];
};

export const getReviewWindowStart = (today = new Date()) =>
  addMonths(toIsoDate(today), -REVIEW_AFTER_MONTHS);

// Όσα θα είχαν χρεωθεί φέτος οι συνδρομές που ακύρωσες, από την ακύρωση μέχρι σήμερα.
export const getSavedThisYear = (
  cancelled: (Subscription & { cancelledAt: string })[],
  today = new Date(),
) => {
  const todayIso = toIsoDate(today);
  const yearStart = `${today.getFullYear()}-01-01`;

  return cancelled.reduce((sum, subscription) => {
    const from = subscription.cancelledAt > yearStart ? subscription.cancelledAt : yearStart;
    let saved = 0;
    let date = subscription.nextChargeDate;
    while (date <= todayIso) {
      if (date >= from) saved += getMyCost(subscription);
      date = addCycle(date, subscription.cycle);
    }
    return sum + saved;
  }, 0);
};
