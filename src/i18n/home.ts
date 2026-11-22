import type { Strings } from './index';

export const homeStrings = {
  'home.title': { el: 'Το Τσεπάκι μου', en: 'My Tsepaki' },

  'summary.count': { el: '{count} συνδρομές', en: '{count} subscriptions' },
  'summary.countOne': { el: '1 συνδρομή', en: '1 subscription' },
  'summary.caption': { el: 'το σύνολο αυτού του μήνα', en: 'total for this month' },
  'summary.paid': { el: 'Πληρώθηκαν', en: 'Paid' },
  'summary.paidLabel': { el: 'Δες τι πληρώθηκε', en: 'See what was paid' },
  'summary.hideAmounts': { el: 'Κρύψε τα ποσά', en: 'Hide amounts' },
  'summary.showAmounts': { el: 'Δείξε τα ποσά', en: 'Show amounts' },
  'summary.remaining': { el: 'Απομένουν', en: 'Remaining' },

  'upcoming.title': { el: 'Επόμενες χρεώσεις', en: 'Upcoming charges' },
  'upcoming.all': { el: 'Όλες', en: 'See all' },
  'upcoming.empty': {
    el: 'Δεν έχεις ακόμα συνδρομές. Πρόσθεσε την πρώτη και θα σου θυμίζουμε πριν από κάθε χρέωση.',
    en: 'No subscriptions yet. Add your first one and we’ll remind you before every charge.',
  },
  'upcoming.emptyAction': { el: 'Πρόσθεσε συνδρομή', en: 'Add a subscription' },
  'upcoming.overdue': { el: 'εκκρεμεί', en: 'overdue' },
  'upcoming.swipe': { el: 'Σύρε για τις υπόλοιπες', en: 'Swipe for more' },
  'upcoming.markPaid': { el: 'Πλήρωσα', en: 'Paid' },
  'upcoming.markPaidLabel': {
    el: 'Σημείωσε το {name} ως πληρωμένο',
    en: 'Mark {name} as paid',
  },
} satisfies Strings;