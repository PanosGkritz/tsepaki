import type { Strings } from './index';

export const settingsStrings = {
  'settings.title': { el: 'Ρυθμίσεις', en: 'Settings' },

  'settings.you': { el: 'Εσύ', en: 'You' },
  'settings.nameLabel': { el: 'Πώς να σε φωνάζω;', en: 'What should I call you?' },
  'settings.namePlaceholder': { el: 'π.χ. Πάνο', en: 'e.g. Alex' },
  'settings.nameHint': {
    el: 'Εμφανίζεται στον χαιρετισμό της αρχικής οθόνης.',
    en: 'Shown in the greeting on the home screen.',
  },

  'settings.appearance': { el: 'Εμφάνιση', en: 'Appearance' },
  'settings.theme.system': { el: 'Αυτόματο', en: 'Automatic' },
  'settings.theme.dark': { el: 'Σκούρο', en: 'Dark' },
  'settings.theme.light': { el: 'Ανοιχτό', en: 'Light' },
  'settings.themeHint': {
    el: 'Το «Αυτόματο» ακολουθεί τη ρύθμιση του κινητού σου.',
    en: '“Automatic” follows your phone’s setting.',
  },

  'settings.language': { el: 'Γλώσσα', en: 'Language' },

  'settings.security': { el: 'Ασφάλεια', en: 'Security' },
  'settings.appLock': { el: 'Κλείδωμα εφαρμογής', en: 'App lock' },
  'settings.appLockHint': {
    el: 'Ζητάει Face ID, δακτυλικό ή τον κωδικό του κινητού κάθε φορά που ανοίγεις το Τσεπάκι.',
    en: 'Asks for Face ID, fingerprint or your phone’s passcode every time you open Tsepaki.',
  },

  'lock.title': { el: 'Το Τσεπάκι είναι κλειδωμένο', en: 'Tsepaki is locked' },
  'lock.unlock': { el: 'Ξεκλείδωμα', en: 'Unlock' },
  'lock.prompt': { el: 'Ξεκλείδωσε το Τσεπάκι', en: 'Unlock Tsepaki' },
  'lock.confirm': { el: 'Επιβεβαίωσε για να ενεργοποιηθεί το κλείδωμα', en: 'Confirm to turn on the lock' },
  'lock.unavailableTitle': { el: 'Δεν γίνεται κλείδωμα', en: 'Can’t turn on the lock' },
  'lock.unavailable': {
    el: 'Βάλε πρώτα κωδικό, Face ID ή δακτυλικό στις ρυθμίσεις του κινητού σου.',
    en: 'Set up a passcode, Face ID or fingerprint in your phone’s settings first.',
  },

  'settings.notifications': { el: 'Ειδοποιήσεις', en: 'Notifications' },
  'settings.status': { el: 'Κατάσταση', en: 'Status' },
  'settings.status.granted': { el: 'Ενεργές', en: 'On' },
  'settings.status.denied': { el: 'Απενεργοποιημένες', en: 'Off' },
  'settings.status.undetermined': { el: 'Δεν έχουν ρυθμιστεί', en: 'Not set up' },
  'settings.when': { el: 'Πότε να σου θυμίζω', en: 'When to remind you' },
  'settings.day.3': { el: '3 μέρες πριν', en: '3 days before' },
  'settings.day.2': { el: '2 μέρες πριν', en: '2 days before' },
  'settings.day.1': { el: 'Την προηγούμενη', en: 'The day before' },
  'settings.day.0': { el: 'Την ημέρα', en: 'On the day' },
  'settings.time': { el: 'Τι ώρα', en: 'What time' },
  'settings.yearly': {
    el: 'Ετήσιες συνδρομές: μία εβδομάδα πριν',
    en: 'Yearly subscriptions: one week before',
  },
  'settings.noDays': {
    el: 'Δεν έχεις διαλέξει μέρα, οπότε δεν θα σου έρχονται υπενθυμίσεις.',
    en: 'You haven’t picked a day, so you won’t get any reminders.',
  },
  'settings.scheduled': { el: 'Προγραμματισμένες', en: 'Scheduled' },
  'settings.nextReminder': { el: 'Επόμενη υπενθύμιση', en: 'Next reminder' },
  'settings.sendTest': { el: 'Στείλε μια δοκιμαστική', en: 'Send a test' },
  'settings.openPhoneSettings': {
    el: 'Άνοιξε τις ρυθμίσεις του κινητού',
    en: 'Open phone settings',
  },
  'settings.noPermission': {
    el: 'Χωρίς άδεια δεν μπορώ να σου στείλω ειδοποιήσεις.',
    en: 'Without permission I can’t send you notifications.',
  },
  'settings.testComing': { el: 'Έρχεται σε 5 δευτερόλεπτα.', en: 'Coming in 5 seconds.' },

  'settings.contact': { el: 'Επικοινωνία', en: 'Contact' },
  'settings.feedback': { el: 'Στείλε μας τη γνώμη σου', en: 'Send us feedback' },
  'settings.feedbackSubject': { el: 'Τσεπάκι {version} – σχόλια', en: 'Tsepaki {version} – feedback' },
  'settings.rate': { el: 'Βαθμολόγησέ μας', en: 'Rate us' },

  'settings.data': { el: 'Δεδομένα', en: 'Data' },
  'settings.exportBackup': { el: 'Εξαγωγή αντιγράφου', en: 'Export a backup' },
  'settings.importBackup': { el: 'Επαναφορά από αντίγραφο', en: 'Restore from a backup' },
  'settings.backupHint': {
    el: 'Κράτα το αρχείο στο Drive, στα Αρχεία ή στείλ’ το στον εαυτό σου. Έτσι δεν χάνεις τίποτα αν αλλάξεις κινητό.',
    en: 'Keep the file in Drive or Files, or send it to yourself, so nothing is lost if you change phones.',
  },
  'settings.backupShareTitle': { el: 'Αντίγραφο του Τσεπακιού', en: 'Tsepaki backup' },
  'settings.restoreTitle': { el: 'Επαναφορά αντιγράφου', en: 'Restore backup' },
  'settings.restoreMessage': {
    el: 'Το αντίγραφο από {date} έχει {subscriptions} ενεργές συνδρομές και {charges} χρεώσεις. Θα αντικαταστήσει ό,τι έχεις τώρα στο Τσεπάκι.',
    en: 'The backup from {date} has {subscriptions} active subscriptions and {charges} charges. It will replace everything currently in Tsepaki.',
  },
  'settings.restoreConfirm': { el: 'Επαναφορά', en: 'Restore' },
  'settings.restoreDone': { el: 'Έγινε η επαναφορά', en: 'Backup restored' },
  'settings.backupInvalidTitle': { el: 'Δεν γίνεται επαναφορά', en: 'Can’t restore' },
  'settings.backupInvalid': {
    el: 'Αυτό δεν είναι αντίγραφο του Τσεπακιού. Διάλεξε το αρχείο .json που έβγαλες με την «Εξαγωγή αντιγράφου».',
    en: 'This isn’t a Tsepaki backup. Pick the .json file you saved with “Export a backup”.',
  },
  'settings.backupNewer': {
    el: 'Το αντίγραφο είναι από νεότερη έκδοση. Ενημέρωσε πρώτα την εφαρμογή.',
    en: 'This backup is from a newer version. Update the app first.',
  },
  'settings.backupFailed': { el: 'Κάτι πήγε στραβά, δοκίμασε ξανά', en: 'Something went wrong, try again' },
  'settings.deleteAll': { el: 'Διαγραφή όλων των δεδομένων', en: 'Delete all data' },
  'settings.deleteHint': {
    el: 'Σβήνει όλες τις συνδρομές και το ιστορικό σου.',
    en: 'Removes all your subscriptions and history.',
  },
  'settings.deleteMessage': {
    el: 'Θα σβηστούν όλες οι συνδρομές και όλο το ιστορικό σου. Δεν γίνεται αναίρεση.',
    en: 'All your subscriptions and history will be deleted. This can’t be undone.',
  },
  'settings.deleteSure': { el: 'Σίγουρα;', en: 'Are you sure?' },
  'settings.deleteLastChance': {
    el: 'Τελευταία ευκαιρία, μετά χάνονται όλα.',
    en: 'Last chance, after this everything is gone.',
  },
  'settings.deleteEverything': { el: 'Σβήσ’ τα όλα', en: 'Delete everything' },

  'settings.about': { el: 'Σχετικά', en: 'About' },
  'settings.version': { el: 'Έκδοση {version}', en: 'Version {version}' },
  'settings.tagline': {
    el: 'Σου θυμίζω κάθε χρέωση πριν φύγουν τα λεφτά.',
    en: 'I remind you of every charge before the money goes.',
  },
  'settings.maker': { el: 'Φτιαγμένο στην Ελλάδα από τον PG', en: 'Made in Greece by PG' },
  'settings.privacy': {
    el: 'Όλα τα δεδομένα σου μένουν μόνο σε αυτό το κινητό. Δεν συνδεόμαστε με τράπεζα και δεν στέλνουμε τίποτα σε server.',
    en: 'All your data stays on this phone only. We don’t connect to your bank and we don’t send anything to a server.',
  },
  'settings.privacyPolicy': { el: 'Πολιτική απορρήτου', en: 'Privacy policy' },
  'settings.legal': {
    el: 'Τα λογότυπα και τα ονόματα των υπηρεσιών ανήκουν στους κατόχους τους και χρησιμοποιούνται μόνο για να αναγνωρίζεις τις συνδρομές σου. Τα λογότυπα παρέχονται από το Brandfetch, στο οποίο στέλνεται μόνο το όνομα του site της υπηρεσίας.',
    en: 'Service logos and names belong to their owners and are only used to help you recognise your subscriptions. Logos are provided by Brandfetch, which only receives the name of the service’s website.',
  },
} satisfies Strings;