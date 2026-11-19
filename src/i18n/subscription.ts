import type { Strings } from './index';

export const subscriptionStrings = {
  'form.titleNew': { el: 'Νέα συνδρομή', en: 'New subscription' },
  'form.titleManual': { el: 'Χειροκίνητη προσθήκη', en: 'Add your own' },
  'form.titleEdit': { el: 'Επεξεργασία', en: 'Edit' },
  'form.submitNew': { el: 'Πρόσθεσε στο Τσεπάκι', en: 'Add to Tsepaki' },
  'form.submitEdit': { el: 'Αποθήκευση αλλαγών', en: 'Save changes' },
  'form.saving': { el: 'Αποθήκευση…', en: 'Saving…' },
  'form.close': { el: 'Κλείσιμο', en: 'Close' },
  'form.heroPlaceholder': { el: 'Νέα συνδρομή', en: 'New subscription' },
  'form.name': { el: 'Όνομα', en: 'Name' },
  'form.namePlaceholder': { el: 'π.χ. Netflix', en: 'e.g. Netflix' },
  'form.nameLabel': { el: 'Όνομα συνδρομής', en: 'Subscription name' },
  'form.price': { el: 'Τιμή', en: 'Price' },
  'form.priceLabel': { el: 'Τιμή σε ευρώ', en: 'Price in euros' },
  'form.cycle': { el: 'Συχνότητα', en: 'Billing' },
  'form.monthly': { el: 'Μηνιαία', en: 'Monthly' },
  'form.yearly': { el: 'Ετήσια', en: 'Yearly' },
  'form.nextCharge': { el: 'Επόμενη χρέωση', en: 'Next charge' },
  'form.category': { el: 'Κατηγορία', en: 'Category' },
  'form.errorName': { el: 'Βάλε ένα όνομα για τη συνδρομή.', en: 'Give the subscription a name.' },
  'form.errorPrice': { el: 'Βάλε μια σωστή τιμή, π.χ. 9,99.', en: 'Enter a valid price, e.g. 9.99.' },
  'form.errorSave': {
    el: 'Κάτι πήγε στραβά στην αποθήκευση. Δοκίμασε ξανά.',
    en: 'Something went wrong while saving. Please try again.',
  },

  'edit.totalsLabel': { el: 'Έχεις δώσει συνολικά', en: 'Total spent so far' },
  'edit.totalsNone': {
    el: 'Δεν έχει χρεωθεί ακόμα μέσα από το Τσεπάκι.',
    en: 'No charges recorded in Tsepaki yet.',
  },
  'edit.totalsOne': { el: 'σε 1 χρέωση από τον {since}', en: 'across 1 charge since {since}' },
  'edit.totalsMany': {
    el: 'σε {count} χρεώσεις από τον {since}',
    en: 'across {count} charges since {since}',
  },
  'edit.cancelled': { el: 'Την ακύρωσα', en: 'I cancelled it' },
  'edit.delete': { el: 'Διαγραφή', en: 'Delete' },
  'edit.cancelTitle': { el: 'Την ακύρωσες;', en: 'Did you cancel it?' },
  'edit.cancelMessage': {
    el: 'Σταματάω τις υπενθυμίσεις για αυτή τη συνδρομή. Οι χρεώσεις που έχουν γίνει μένουν στο ιστορικό.',
    en: 'I’ll stop the reminders for this subscription. Past charges stay in your history.',
  },
  'edit.cancelNo': { el: 'Όχι', en: 'No' },
  'edit.cancelYes': { el: 'Ναι, την ακύρωσα', en: 'Yes, I cancelled it' },
  'edit.deleteTitle': { el: 'Διαγραφή συνδρομής', en: 'Delete subscription' },
  'edit.deleteMessage': {
    el: 'Θα σβηστεί μαζί με όλες τις χρεώσεις της. Είναι για συνδρομές που πρόσθεσες κατά λάθος.',
    en: 'It will be deleted along with all its charges. Use this for subscriptions you added by mistake.',
  },

  'list.title': { el: 'Οι συνδρομές μου', en: 'My subscriptions' },
  'list.back': { el: 'Πίσω', en: 'Back' },
  'list.monthly': { el: 'Μέσο κόστος / μήνα', en: 'Average per month' },
  'list.yearly': { el: 'Κόστος / χρόνο', en: 'Per year' },
  'list.subtitle': { el: '{cycle} · επόμενη {day}', en: '{cycle} · next {day}' },
  'list.note': {
    el: 'Στο μηνιαίο κόστος οι ετήσιες μετράνε με το 1/12 της τιμής τους.',
    en: 'Yearly subscriptions count as 1/12 of their price in the monthly cost.',
  },
} satisfies Strings;