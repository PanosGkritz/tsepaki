import type { Strings } from './index';

export const screenStrings = {
  'calendar.title': { el: 'Ημερολόγιο', en: 'Calendar' },
  'calendar.totals': { el: '{total} · πληρώθηκαν {paid}', en: '{total} · paid {paid}' },
  'calendar.prevMonth': { el: 'Προηγούμενος μήνας', en: 'Previous month' },
  'calendar.nextMonth': { el: 'Επόμενος μήνας', en: 'Next month' },
  'calendar.dayLabel': { el: '{day}, {count} χρεώσεις', en: '{day}, {count} charges' },
  'calendar.paid': { el: 'Πληρώθηκε', en: 'Paid' },
  'calendar.willCharge': { el: 'Θα χρεωθεί {when}', en: 'Charges {when}' },
  'calendar.empty': { el: 'Καμία χρέωση αυτή τη μέρα.', en: 'No charges on this day.' },

  'history.title': { el: 'Ιστορικό', en: 'History' },
  'history.paidThisYear': { el: 'Πλήρωσες φέτος', en: 'Paid this year' },
  'history.charges': { el: 'Χρεώσεις', en: 'Charges' },
  'history.average': { el: 'Μέσος όρος / μήνα', en: 'Average / month' },
  'history.byMonth': { el: 'Ανά μήνα', en: 'By month' },
  'history.categories': { el: 'Πού πάνε τα λεφτά σου', en: 'Where your money goes' },
  'history.categoriesNote': {
    el: 'Μηνιαίο κόστος των ενεργών συνδρομών σου.',
    en: 'Monthly cost of your active subscriptions.',
  },
  'history.all': { el: 'Όλες οι χρεώσεις', en: 'All charges' },
  'history.searchLabel': { el: 'Αναζήτηση στο ιστορικό', en: 'Search history' },
  'history.empty': {
    el: 'Δεν υπάρχουν ακόμα χρεώσεις. Καταγράφονται μόνες τους μόλις περάσει η μέρα χρέωσης, ή όταν πατάς «Το πλήρωσα» στην ειδοποίηση.',
    en: 'No charges yet. They’re recorded automatically once the charge day passes, or when you tap “I paid it” on a notification.',
  },
  'history.notFound': { el: 'Δεν βρέθηκε χρέωση για «{query}».', en: 'No charges found for “{query}”.' },

  'bars.withRemaining': { el: ' · μαζί με όσα απομένουν', en: ' · including what’s left' },
  'bars.same': { el: 'Ίδιο με τον {month}', en: 'Same as {month}' },
  'bars.change': { el: '{change} σε σχέση με τον {month}', en: '{change} vs {month}' },

  'welcome.title': { el: 'Καλώς ήρθες στο Τσεπάκι', en: 'Welcome to Tsepaki' },
  'welcome.subtitle': {
    el: 'Σου θυμίζω κάθε χρέωση πριν φύγουν τα λεφτά, για να μη μείνεις ποτέ ταπί.',
    en: 'I remind you of every charge before the money goes, so you’re never caught short.',
  },
  'welcome.hint': {
    el: 'Όλα μένουν μόνο στο κινητό σου. Δεν χρειάζεται λογαριασμός.',
    en: 'Everything stays on your phone. No account needed.',
  },
  'welcome.start': { el: 'Ξεκίνα', en: 'Get started' },
  'intro.title': { el: 'Όλα έτοιμα!', en: 'You’re all set!' },
  'intro.subtitle': {
    el: 'Να τι κάνει το Τσεπάκι για σένα:',
    en: 'Here’s what Tsepaki does for you:',
  },
  'intro.reminders': {
    el: 'Σου θυμίζει πριν από κάθε χρέωση, όποτε θες εσύ.',
    en: 'Reminds you before every charge, when you choose.',
  },
  'intro.catalog': {
    el: 'Προσθέτεις Netflix, Spotify και άλλες 40+ με ένα πάτημα.',
    en: 'Add Netflix, Spotify and 40+ more in one tap.',
  },
  'intro.overview': {
    el: 'Βλέπεις πόσα δίνεις τον μήνα και πού πάνε.',
    en: 'See what you spend each month and where it goes.',
  },
  'intro.privacy': {
    el: 'Όλα μένουν στο κινητό σου. Χωρίς λογαριασμό.',
    en: 'Everything stays on your phone. No account needed.',
  },
  'intro.continue': { el: 'Πάμε στην αρχική', en: 'Go to home' },
} satisfies Strings;