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
} satisfies Strings;