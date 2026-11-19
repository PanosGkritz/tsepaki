import type { Strings } from './index';

export const homeStrings = {
  'home.title': { el: 'Το Τσεπάκι μου', en: 'My Tsepaki' },

  'summary.count': { el: '{count} συνδρομές', en: '{count} subscriptions' },
  'summary.countOne': { el: '1 συνδρομή', en: '1 subscription' },
  'summary.caption': { el: 'το σύνολο αυτού του μήνα', en: 'total for this month' },
  'summary.paid': { el: 'Πληρώθηκαν', en: 'Paid' },
  'summary.remaining': { el: 'Απομένουν', en: 'Remaining' },

  'upcoming.title': { el: 'Επόμενες χρεώσεις', en: 'Upcoming charges' },
  'upcoming.all': { el: 'Όλες', en: 'See all' },
  'upcoming.empty': {
    el: 'Δεν έχεις ακόμα συνδρομές. Πάτα το + για να προσθέσεις.',
    en: 'You don’t have any subscriptions yet. Tap + to add one.',
  },
} satisfies Strings;