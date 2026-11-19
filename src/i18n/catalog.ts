import type { Strings } from './index';

export const catalogStrings = {
  'category.all': { el: 'Όλα', en: 'All' },
  'category.streaming': { el: 'Streaming', en: 'Streaming' },
  'category.music': { el: 'Μουσική', en: 'Music' },
  'category.gaming': { el: 'Gaming', en: 'Gaming' },
  'category.ai': { el: 'AI', en: 'AI' },
  'category.storage': { el: 'Αποθήκευση', en: 'Storage' },
  'category.mobile': { el: 'Κινητό', en: 'Mobile' },
  'category.tv': { el: 'TV', en: 'TV' },
  'category.activities': { el: 'Δραστηριότητες', en: 'Activities' },
  'category.other': { el: 'Άλλο', en: 'Other' },

  'service.gym': { el: 'Γυμναστήριο', en: 'Gym' },
  'service.tennis': { el: 'Μαθήματα τένις', en: 'Tennis lessons' },
  'service.piano': { el: 'Μαθήματα πιάνου', en: 'Piano lessons' },

  'add.title': { el: 'Νέα συνδρομή', en: 'New subscription' },
  'add.search': { el: 'Αναζήτηση, π.χ. Netflix', en: 'Search, e.g. Netflix' },
  'add.searchLabel': { el: 'Αναζήτηση υπηρεσίας', en: 'Search services' },
  'add.popular': { el: 'Δημοφιλείς στην Ελλάδα', en: 'Popular' },
  'add.offline': { el: 'Συνδρομές εκτός internet', en: 'Offline subscriptions' },
  'add.offlineHint': {
    el: 'Ό,τι πληρώνεις σταθερά: γυμναστήριο, μαθήματα, φροντιστήριο, ενοίκιο.',
    en: 'Anything you pay regularly: gym, lessons, tutoring, rent.',
  },
  'add.empty': {
    el: 'Δεν βρέθηκε. Πρόσθεσέ το μόνος σου από κάτω.',
    en: 'Not found. Add it yourself below.',
  },
  'add.manual': { el: 'Πρόσθεσε κάτι δικό σου', en: 'Add your own' },
  'add.added': { el: 'έχει προστεθεί', en: 'already added' },
} satisfies Strings;