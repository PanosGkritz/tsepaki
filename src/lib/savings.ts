import { findService, getPlanPrice, getServicePlans, type ServicePlan } from '../data/services';
import type { StringKey } from '../i18n';
import type { BillingCycle, Subscription } from '../types/subscription';
import { daysUntil } from './dates';
import { getMyCost } from './share';

// «Γλίτωσέ τα» (Pro): προτάσεις οικονομίας με απλούς κανόνες μέσα στη συσκευή.
// Τίποτα δεν φεύγει από το κινητό και κάθε ποσό βγαίνει από τις συνδρομές του χρήστη.

export type TipKind = 'trial' | 'bundle' | 'overlap' | 'yearly' | 'cheaperPlan';

export type SavingTip = {
  // Σταθερό για την ίδια πρόταση, ώστε το «Δεν με ενδιαφέρει» να την κρύβει για πάντα.
  id: string;
  kind: TipKind;
  titleKey: StringKey;
  bodyKey: StringKey;
  params: Record<string, string | number>;
  // Πόσα γλιτώνει τον χρόνο (στο νόμισμα του χρήστη).
  yearlySaving: number;
  subscriptionId: string;
  // Πόσα από τα παραπάνω αντιστοιχούν σε κάθε συνδρομή, για να μη μετράμε δύο φορές τα ίδια.
  affects: { id: string; saving: number }[];
};

type Money = (amount: number) => string;

const TRIAL_WINDOW_DAYS = 7;

const yearlyCost = (subscription: Subscription) =>
  subscription.cycle === 'yearly' ? getMyCost(subscription) : getMyCost(subscription) * 12;

const round = (value: number) => Math.round(value * 100) / 100;

const listNames = (subscriptions: Subscription[]) =>
  subscriptions.map((subscription) => subscription.name).join(', ');

// Ομάδες όπου συνήθως φτάνει μία υπηρεσία, και από πόσες και πάνω αξίζει να το πούμε.
const OVERLAP_CATEGORIES: { category: string; min: number; titleKey: StringKey }[] = [
  { category: 'music', min: 2, titleKey: 'tips.overlapMusic' },
  { category: 'streaming', min: 3, titleKey: 'tips.overlapStreaming' },
  { category: 'ai', min: 2, titleKey: 'tips.overlapAi' },
  { category: 'storage', min: 2, titleKey: 'tips.overlapStorage' },
  { category: 'delivery', min: 2, titleKey: 'tips.overlapDelivery' },
  { category: 'gaming', min: 3, titleKey: 'tips.overlapGaming' },
];

// Πακέτα που έχουν ήδη μέσα άλλες υπηρεσίες.
const BUNDLES: { bundle: string; includes: string[] }[] = [
  { bundle: 'appleone', includes: ['icloud', 'applemusic', 'appletv'] },
  { bundle: 'youtube', includes: ['spotify', 'applemusic', 'deezer', 'tidal'] },
];

// Πακέτα που δεν τα δικαιούνται όλοι, οπότε δεν τα προτείνουμε ως φθηνότερη λύση.
const RESTRICTED_PLAN = /student|φοιτητ/i;

const findCurrentPlan = (subscription: Subscription, plans: ServicePlan[]) => {
  if (subscription.plan) {
    const named = plans.find((plan) => plan.name === subscription.plan);
    if (named) return named;
  }
  const matches = plans.filter(
    (plan) => getPlanPrice(plan, subscription.cycle) === subscription.price,
  );
  return matches.length === 1 ? matches[0] : undefined;
};

const periodsPerYear = (cycle: BillingCycle) => (cycle === 'yearly' ? 1 : 12);

const trialTips = (subscriptions: Subscription[], money: Money): SavingTip[] =>
  subscriptions.flatMap((subscription): SavingTip[] => {
    if (!subscription.isTrial) return [];
    const days = daysUntil(subscription.nextChargeDate);
    if (days < 0 || days > TRIAL_WINDOW_DAYS) return [];

    return [
      {
        id: `trial-${subscription.id}-${subscription.nextChargeDate}`,
        kind: 'trial',
        titleKey: 'tips.trialTitle',
        bodyKey: subscription.cycle === 'yearly' ? 'tips.trialBodyYearly' : 'tips.trialBody',
        params: { name: subscription.name, days, amount: money(getMyCost(subscription)) },
        yearlySaving: yearlyCost(subscription),
        subscriptionId: subscription.id,
        affects: [{ id: subscription.id, saving: yearlyCost(subscription) }],
      },
    ];
  });

const bundleTips = (active: Subscription[], money: Money): SavingTip[] =>
  BUNDLES.flatMap(({ bundle, includes }): SavingTip[] => {
    const bundleSubscription = active.find((subscription) => subscription.serviceId === bundle);
    if (!bundleSubscription) return [];

    const extra = active.filter(
      (subscription) => subscription.serviceId && includes.includes(subscription.serviceId),
    );
    if (extra.length === 0) return [];

    const saving = extra.reduce((sum, subscription) => sum + yearlyCost(subscription), 0);
    return [
      {
        id: `bundle-${bundle}-${extra.map((subscription) => subscription.id).sort().join('-')}`,
        kind: 'bundle',
        titleKey: bundle === 'youtube' ? 'tips.bundleYoutubeTitle' : 'tips.bundleAppleTitle',
        bodyKey: bundle === 'youtube' ? 'tips.bundleYoutubeBody' : 'tips.bundleAppleBody',
        params: { names: listNames(extra), amount: money(saving) },
        yearlySaving: saving,
        subscriptionId: extra[0].id,
        affects: extra.map((subscription) => ({
          id: subscription.id,
          saving: yearlyCost(subscription),
        })),
      },
    ];
  });

const overlapTips = (active: Subscription[], money: Money): SavingTip[] =>
  OVERLAP_CATEGORIES.flatMap(({ category, min, titleKey }): SavingTip[] => {
    const group = active.filter((subscription) => subscription.category === category);
    if (group.length < min) return [];

    // Αν κρατήσει μόνο την πιο ακριβή, γλιτώνει τις υπόλοιπες: έτσι το «έως» δεν υπερβάλλει.
    const sorted = [...group].sort((a, b) => yearlyCost(b) - yearlyCost(a));
    const saving = sorted.slice(1).reduce((sum, subscription) => sum + yearlyCost(subscription), 0);

    return [
      {
        id: `overlap-${category}-${group.map((subscription) => subscription.id).sort().join('-')}`,
        kind: 'overlap',
        titleKey,
        bodyKey: category === 'streaming' ? 'tips.overlapRotateBody' : 'tips.overlapBody',
        params: { count: group.length, names: listNames(group), amount: money(saving) },
        yearlySaving: saving,
        subscriptionId: sorted[sorted.length - 1].id,
        affects: sorted.slice(1).map((subscription) => ({
          id: subscription.id,
          saving: yearlyCost(subscription),
        })),
      },
    ];
  });

const planTips = (active: Subscription[], money: Money): SavingTip[] =>
  active.flatMap((subscription): SavingTip[] => {
    // Μόνο όσες πληρώνει ολόκληρες ο ίδιος: στις κοινές η αλλαγή πακέτου είναι κοινή απόφαση.
    if (!subscription.serviceId || subscription.share) return [];
    const plans = getServicePlans(findService(subscription.serviceId));
    const current = findCurrentPlan(subscription, plans);
    if (!current) return [];

    const tips: SavingTip[] = [];

    // Ετήσιο πακέτο φθηνότερο από 12 μηνιαίες.
    if (subscription.cycle === 'monthly' && current.yearly !== undefined) {
      const saving = round(subscription.price * 12 - current.yearly);
      if (saving > 0) {
        tips.push({
          id: `yearly-${subscription.id}-${current.name}-${current.yearly}`,
          kind: 'yearly',
          titleKey: 'tips.yearlyTitle',
          bodyKey: 'tips.yearlyBody',
          params: {
            name: subscription.name,
            yearly: money(current.yearly),
            current: money(subscription.price * 12),
            amount: money(saving),
          },
          yearlySaving: saving,
          subscriptionId: subscription.id,
          affects: [{ id: subscription.id, saving }],
        });
      }
    }

    // Φθηνότερο πακέτο της ίδιας υπηρεσίας, στην ίδια συχνότητα.
    const cheaper = plans
      .filter((plan) => plan !== current && !RESTRICTED_PLAN.test(plan.name))
      .map((plan) => ({ plan, price: getPlanPrice(plan, subscription.cycle) }))
      .filter(
        (item): item is { plan: ServicePlan; price: number } =>
          item.price !== undefined && item.price < subscription.price,
      )
      .sort((a, b) => a.price - b.price)[0];

    if (cheaper) {
      const saving = round((subscription.price - cheaper.price) * periodsPerYear(subscription.cycle));
      tips.push({
        id: `plan-${subscription.id}-${cheaper.plan.name}-${cheaper.price}`,
        kind: 'cheaperPlan',
        titleKey: 'tips.planTitle',
        bodyKey: subscription.cycle === 'yearly' ? 'tips.planBodyYearly' : 'tips.planBody',
        params: {
          name: subscription.name,
          plan: cheaper.plan.name,
          price: money(cheaper.price),
          current: money(subscription.price),
          amount: money(saving),
        },
        yearlySaving: saving,
        subscriptionId: subscription.id,
        affects: [{ id: subscription.id, saving }],
      });
    }

    return tips;
  });

type TipOptions = {
  money: Money;
  // Οι τιμές του καταλόγου είναι σε ευρώ: σε άλλο νόμισμα δεν τις συγκρίνουμε.
  usesCatalogPrices: boolean;
  dismissed: string[];
};

export const getSavingTips = (subscriptions: Subscription[], options: TipOptions) => {
  const active = subscriptions.filter((subscription) => !subscription.isTrial);
  const bundles = bundleTips(active, options.money);
  const bundled = new Set(bundles.flatMap((tip) => tip.affects.map((item) => item.id)));

  // Αν ένα πακέτο καλύπτει ήδη όσες θα έκοβε μια «επικάλυψη», η επικάλυψη περισσεύει.
  const overlaps = overlapTips(active, options.money).filter(
    (tip) => !tip.affects.every((item) => bundled.has(item.id)),
  );

  const tips = [
    ...trialTips(subscriptions, options.money),
    ...bundles,
    ...overlaps,
    ...(options.usesCatalogPrices ? planTips(active, options.money) : []),
  ]
    .filter((tip) => tip.yearlySaving > 0 && !options.dismissed.includes(tip.id))
    .sort((a, b) => b.yearlySaving - a.yearlySaving);

  // Το «έως»: για κάθε συνδρομή μετράμε μόνο τη μεγαλύτερη οικονομία που της αντιστοιχεί,
  // ώστε δύο προτάσεις για την ίδια συνδρομή να μη διπλομετρούν.
  const bySubscription = new Map<string, number>();
  for (const tip of tips) {
    for (const item of tip.affects) {
      bySubscription.set(item.id, Math.max(bySubscription.get(item.id) ?? 0, item.saving));
    }
  }
  const total = [...bySubscription.values()].reduce((sum, saving) => sum + saving, 0);

  return { tips, yearlyTotal: round(total) };
};
