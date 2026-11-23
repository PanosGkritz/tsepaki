import type { Strings } from './index';

export const proStrings = {
  'currency.label': { el: 'Νόμισμα', en: 'Currency' },
  'currency.other': { el: 'Άλλο…', en: 'Other…' },
  'currency.welcomeHint': {
    el: 'Όλα τα ποσά θα φαίνονται σε αυτό. Το αλλάζεις όποτε θες από τις Ρυθμίσεις.',
    en: 'All amounts will show in this currency. You can change it anytime in Settings.',
  },
  'currency.settingsHint': {
    el: 'Αλλάζει μόνο το σύμβολο. Τα ποσά δεν μετατρέπονται: τα 10 € θα γίνουν 10 $. Αν αλλάξεις νόμισμα, διόρθωσε τις τιμές των συνδρομών σου. Οι έτοιμες τιμές του καταλόγου υπάρχουν μόνο σε ευρώ.',
    en: 'Only the symbol changes. Amounts aren’t converted: €10 becomes $10. If you switch, update your subscription prices. Catalog prices are only available in euros.',
  },

  'review.question': { el: 'Το χρησιμοποιείς ακόμα;', en: 'Still using it?' },
  'review.perMonth': { el: '{amount}/μήνα', en: '{amount}/mo' },
  'review.perYear': { el: '{amount}/χρόνο', en: '{amount}/yr' },
  'review.cost': {
    el: 'Τους τελευταίους 4 μήνες σού κόστισε {amount}.',
    en: 'It cost you {amount} over the last 4 months.',
  },
  'review.keep': { el: 'Ναι, το κρατάω', en: 'Yes, keep it' },
  'review.cancel': { el: 'Όχι, ακύρωσέ το', en: 'No, cancel it' },
  'review.cancelTitle': { el: 'Να το βγάλω από το Τσεπάκι;', en: 'Remove it from Tsepaki?' },
  'review.cancelMessage': {
    el: 'Θυμήσου να το ακυρώσεις και στο {name}, αλλιώς θα συνεχίσει να σε χρεώνει. Οι χρεώσεις που έχουν γίνει μένουν στο ιστορικό.',
    en: 'Remember to cancel it with {name} too, or it will keep charging you. Past charges stay in your history.',
  },
  'review.cancelConfirm': { el: 'Ναι, ακύρωσέ το', en: 'Yes, cancel it' },
  'history.saved': { el: 'Γλίτωσες {amount} φέτος', en: 'You saved {amount} this year' },
  'history.savedNote': {
    el: 'Όσα θα είχαν χρεωθεί φέτος οι συνδρομές που ακύρωσες, αν τις κρατούσες.',
    en: 'What the subscriptions you cancelled would have charged this year if you’d kept them.',
  },

  'share.toggle': { el: 'Τη μοιράζομαι', en: 'I share it' },
  'share.toggleHint': {
    el: 'Αν τη μοιράζεσαι με φίλους ή οικογένεια, χώρισε το ποσό. Στα σύνολά σου θα μετράει μόνο το δικό σου μερίδιο.',
    en: 'If you split it with friends or family, divide the cost. Only your share will count in your totals.',
  },
  'share.namePlaceholder': { el: 'Όνομα, π.χ. Γιώργος', en: 'Name, e.g. Sam' },
  'share.nameLabel': { el: 'Όνομα ατόμου', en: 'Person’s name' },
  'share.add': { el: 'Πρόσθεσε άτομο', en: 'Add person' },
  'share.remove': { el: 'Αφαίρεσε {name}', en: 'Remove {name}' },
  'share.amountLabel': { el: 'Ποσό για {name}', en: 'Amount for {name}' },
  'share.equal': { el: 'Ίσα', en: 'Equally' },
  'share.custom': { el: 'Δικά μου ποσά', en: 'Custom amounts' },
  'share.me': { el: 'Εσύ', en: 'You' },
  'share.you': { el: 'το μερίδιό σου', en: 'your share' },
  'share.payer': { el: 'Ποιος πληρώνει;', en: 'Who pays?' },
  'share.payerMeHint': {
    el: 'Τη μέρα της χρέωσης σου θυμίζω να ζητήσεις τα μερίδια.',
    en: 'On charge day I’ll remind you to ask for the shares.',
  },
  'share.payerOtherHint': {
    el: 'Την προηγούμενη μέρα σου θυμίζω να δώσεις το μερίδιό σου. Πληρώνει: {name}.',
    en: 'The day before, I’ll remind you to give your share to {name}.',
  },
  'share.rowTotalOne': {
    el: 'συνολικά {total} · μαζί με 1 άτομο',
    en: '{total} in total · shared with 1 person',
  },
  'share.rowTotal': {
    el: 'συνολικά {total} · μαζί με {count} άτομα',
    en: '{total} in total · shared with {count} people',
  },
  'share.rowPayer': { el: 'συνολικά {total} · πληρώνει: {name}', en: '{total} in total · paid by {name}' },
  'share.errorPeople': {
    el: 'Πρόσθεσε τουλάχιστον ένα άτομο ή κλείσε το «Τη μοιράζομαι».',
    en: 'Add at least one person or turn off “I share it”.',
  },
  'share.errorAmounts': {
    el: 'Τα ποσά των άλλων είναι περισσότερα από τη συνολική τιμή. Μείωσέ τα.',
    en: 'The other amounts add up to more than the total price. Lower them.',
  },
  'share.paymentsTitle': { el: 'Ποιος σού έδωσε το μερίδιό του', en: 'Who has paid you back' },
  'share.paymentsHint': {
    el: 'Πάτα σε κάποιον όταν σου δώσει τα λεφτά του.',
    en: 'Tap someone once they’ve paid you.',
  },
  'share.paymentsEmpty': {
    el: 'Μόλις περάσει η πρώτη χρέωση, εδώ σημειώνεις ποιος σού έδωσε το μερίδιό του.',
    en: 'Once the first charge goes through, mark here who has paid you back.',
  },
  'share.chargeOn': { el: 'Χρέωση {day}', en: 'Charge on {day}' },
  'share.paidLabel': { el: '{name} πλήρωσε', en: '{name} paid' },
  'share.allPaid': { el: 'Όλοι πλήρωσαν!', en: 'Everyone paid!' },
  'share.ask': { el: 'Στείλε μήνυμα για τα μερίδια', en: 'Send a message for the shares' },

  'settings.pro': { el: 'Pro', en: 'Pro' },
  'settings.devPro': { el: 'Pro (δοκιμή developer)', en: 'Pro (developer test)' },
  'settings.devProHint': {
    el: 'Φαίνεται μόνο στο Expo Go, μέχρι να μπουν οι πληρωμές του Google Play.',
    en: 'Only shown in Expo Go until Google Play billing is added.',
  },
  'settings.countFullShared': {
    el: 'Κοινές συνδρομές: δείξε όλο το ποσό',
    en: 'Shared subscriptions: show the full price',
  },
  'settings.countFullSharedHint': {
    el: 'Στα σύνολα θα μετράει όλη η τιμή αντί για το μερίδιό σου. Χρήσιμο αν πληρώνεις εσύ με την κάρτα σου. Το ιστορικό κρατάει πάντα το μερίδιό σου.',
    en: 'Totals will count the full price instead of your share. Useful if you pay with your own card. History always keeps your share.',
  },
} satisfies Strings;
