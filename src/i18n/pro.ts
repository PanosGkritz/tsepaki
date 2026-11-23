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

  'pro.title': { el: 'Τσεπάκι Pro', en: 'Tsepaki Pro' },
  'pro.benefitShared': {
    el: 'Κοινές συνδρομές: χωρίζεις το ποσό και βλέπεις ποιος σού χρωστάει',
    en: 'Shared subscriptions: split the cost and see who owes you',
  },
  'pro.benefitPrices': {
    el: 'Ιστορικό τιμών και ειδοποίηση όταν ανεβαίνει μια τιμή',
    en: 'Price history and an alert when a price goes up',
  },
  'pro.benefitSave': {
    el: '«Γλίτωσέ τα»: προτάσεις για να πληρώνεις λιγότερα',
    en: '“Save it”: tips to pay less',
  },
  'pro.benefitWrapped': {
    el: 'Η χρονιά σου σε συνδρομές, έτοιμη για κοινοποίηση',
    en: 'Your year in subscriptions, ready to share',
  },
  'pro.benefitWidgets': {
    el: 'Widgets για την αρχική οθόνη του κινητού',
    en: 'Home screen widgets',
  },
  'pro.soon': { el: 'σύντομα', en: 'soon' },
  'pro.oneTime': {
    el: 'μία φορά, για πάντα · χωρίς συνδρομή',
    en: 'one time, forever · no subscription',
  },
  'pro.buy': { el: 'Απόκτησε το Pro', en: 'Get Pro' },
  'pro.active': { el: 'Το Pro είναι ενεργό', en: 'Pro is active' },
  'pro.soonTitle': { el: 'Έρχεται σύντομα', en: 'Coming soon' },
  'pro.soonMessage': {
    el: 'Η αγορά του Pro θα ανοίξει σύντομα μέσα από το Google Play.',
    en: 'You’ll be able to buy Pro through Google Play soon.',
  },

  'common.close': { el: 'Κλείσιμο', en: 'Close' },
  'pro.screenTitle': { el: 'Πάρε περισσότερα από το Τσεπάκι', en: 'Get more from Tsepaki' },
  'pro.screenSubtitle': {
    el: 'Με το Pro βλέπεις πού μπορείς να γλιτώσεις, μαθαίνεις όταν ανεβαίνει μια τιμή και μοιράζεσαι συνδρομές με φίλους.',
    en: 'With Pro you see where you can save, find out when a price goes up and share subscriptions with friends.',
  },
  'pro.freeNote': {
    el: 'Οι υπενθυμίσεις, οι απεριόριστες συνδρομές, το ιστορικό και το αντίγραφο ασφαλείας μένουν πάντα δωρεάν.',
    en: 'Reminders, unlimited subscriptions, history and backups always stay free.',
  },
  'pro.settingsRow': { el: 'Τσεπάκι Pro', en: 'Tsepaki Pro' },
  'pro.settingsActive': { el: 'Ενεργό', en: 'Active' },

  'priceUp.title': { el: 'Το {name} ακρίβυνε', en: '{name} went up' },
  'priceUp.question': {
    el: 'Το κρατάς με τη νέα τιμή; Οι υπενθυμίσεις και τα σύνολα θα δείχνουν το νέο ποσό.',
    en: 'Keeping it at the new price? Reminders and totals will show the new amount.',
  },
  'priceUp.questionYearly': {
    el: 'Η ετήσια τιμή ανέβηκε. Το κρατάς με τη νέα τιμή; Οι υπενθυμίσεις και τα σύνολα θα δείχνουν το νέο ποσό.',
    en: 'The yearly price went up. Keeping it at the new price? Reminders and totals will show the new amount.',
  },
  'priceUp.keep': { el: 'Ναι, το κρατάω', en: 'Yes, keep it' },
  'priceUp.notChanged': {
    el: 'Εμένα δεν μου άλλαξε η τιμή',
    en: 'My price hasn’t changed',
  },
  'priceHistory.title': { el: 'Ιστορικό τιμής', en: 'Price history' },
  'priceHistory.unchanged': {
    el: 'Η τιμή δεν έχει αλλάξει.',
    en: 'The price hasn’t changed.',
  },
  'priceHistory.unchangedSince': {
    el: 'Η τιμή δεν έχει αλλάξει από τις {date}, που την πρόσθεσες.',
    en: 'The price hasn’t changed since you added it on {date}.',
  },
  'priceHistory.teaser': {
    el: 'Δες πώς άλλαξε η τιμή με το Pro',
    en: 'See how the price changed with Pro',
  },

  'tips.title': { el: 'Γλίτωσέ τα', en: 'Save it' },
  'tips.upTo': { el: 'έως {amount}/χρόνο', en: 'up to {amount}/yr' },
  'tips.teaser': {
    el: 'Με το Pro μπορείς να γλιτώσεις έως {monthly} τον μήνα ({yearly} τον χρόνο). Το νούμερο βγαίνει από τις δικές σου συνδρομές.',
    en: 'With Pro you could save up to {monthly} a month ({yearly} a year). This is worked out from your own subscriptions.',
  },
  'tips.teaserAction': { el: 'Δες πώς', en: 'See how' },
  'tips.open': { el: 'Δες τη συνδρομή', en: 'View subscription' },
  'tips.dismiss': { el: 'Δεν με ενδιαφέρει', en: 'Not interested' },
  'tips.trialTitle': { el: 'Λήγει η δοκιμή του {name}', en: 'Your {name} trial is ending' },
  'tips.trialBody': {
    el: 'Σε {days} μέρες αρχίζει να χρεώνει {amount} τον μήνα. Αν δεν το χρειάζεσαι, ακύρωσέ το πριν από τότε.',
    en: 'In {days} days it starts charging {amount} a month. If you don’t need it, cancel before then.',
  },
  'tips.trialBodyYearly': {
    el: 'Σε {days} μέρες αρχίζει να χρεώνει {amount} τον χρόνο. Αν δεν το χρειάζεσαι, ακύρωσέ το πριν από τότε.',
    en: 'In {days} days it starts charging {amount} a year. If you don’t need it, cancel before then.',
  },
  'tips.bundleYoutubeTitle': {
    el: 'Το YouTube Premium έχει ήδη μουσική',
    en: 'YouTube Premium already includes music',
  },
  'tips.bundleYoutubeBody': {
    el: 'Μαζί του παίρνεις και το YouTube Music. Αν σου αρκεί, το {names} περισσεύει και γλιτώνεις {amount} τον χρόνο.',
    en: 'It comes with YouTube Music. If that’s enough for you, you can drop {names} and save {amount} a year.',
  },
  'tips.bundleAppleTitle': {
    el: 'Το Apple One τα έχει ήδη μέσα',
    en: 'Apple One already includes these',
  },
  'tips.bundleAppleBody': {
    el: 'Πληρώνεις ξεχωριστά και {names}, που περιλαμβάνονται στο Apple One. Αν το πακέτο σου τα καλύπτει, γλιτώνεις {amount} τον χρόνο.',
    en: 'You also pay separately for {names}, which come with Apple One. If your plan covers them, you save {amount} a year.',
  },
  'tips.overlapMusic': { el: 'Πληρώνεις {count} υπηρεσίες μουσικής', en: 'You pay for {count} music services' },
  'tips.overlapStreaming': { el: 'Έχεις {count} υπηρεσίες streaming', en: 'You have {count} streaming services' },
  'tips.overlapAi': { el: 'Πληρώνεις {count} εργαλεία AI', en: 'You pay for {count} AI tools' },
  'tips.overlapStorage': { el: 'Πληρώνεις {count} υπηρεσίες αποθήκευσης', en: 'You pay for {count} storage services' },
  'tips.overlapDelivery': { el: 'Έχεις {count} συνδρομές delivery', en: 'You have {count} delivery memberships' },
  'tips.overlapGaming': { el: 'Έχεις {count} συνδρομές gaming', en: 'You have {count} gaming subscriptions' },
  'tips.overlapBody': {
    el: '{names}. Συνήθως φτάνει μία. Αν κρατήσεις μόνο την ακριβότερη, γλιτώνεις {amount} τον χρόνο.',
    en: '{names}. One is usually enough. Keeping only the most expensive saves you {amount} a year.',
  },
  'tips.overlapRotateBody': {
    el: '{names}. Δοκίμασε να κρατάς μία κάθε μήνα και να αλλάζεις: γλιτώνεις έως {amount} τον χρόνο.',
    en: '{names}. Try keeping one at a time and switching each month: you save up to {amount} a year.',
  },
  'tips.yearlyTitle': { el: 'Το {name} βγαίνει φθηνότερο ετήσια', en: '{name} is cheaper yearly' },
  'tips.yearlyBody': {
    el: 'Με το ετήσιο πακέτο πληρώνεις {yearly} τον χρόνο αντί για {current}. Γλιτώνεις {amount}.',
    en: 'With the yearly plan you pay {yearly} a year instead of {current}. You save {amount}.',
  },
  'tips.planTitle': { el: 'Φθηνότερο πακέτο στο {name}', en: 'A cheaper {name} plan' },
  'tips.planBody': {
    el: 'Το {plan} κοστίζει {price} τον μήνα αντί για {current}. Αν σου φτάνει, γλιτώνεις {amount} τον χρόνο.',
    en: '{plan} costs {price} a month instead of {current}. If it’s enough for you, you save {amount} a year.',
  },
  'tips.planBodyYearly': {
    el: 'Το {plan} κοστίζει {price} τον χρόνο αντί για {current}. Αν σου φτάνει, γλιτώνεις {amount}.',
    en: '{plan} costs {price} a year instead of {current}. If it’s enough for you, you save {amount}.',
  },

  'wrapped.entryTitle': { el: 'Η χρονιά σου σε συνδρομές', en: 'Your year in subscriptions' },
  'wrapped.entryText': {
    el: 'Πόσα έδωσες, η αγαπημένη σου, ο πιο ακριβός μήνας. Έτοιμο για κοινοποίηση.',
    en: 'What you spent, your favourite, your priciest month. Ready to share.',
  },
  'wrapped.introLabel': { el: 'Η χρονιά σου σε συνδρομές', en: 'Your year in subscriptions' },
  'wrapped.introTitle': { el: 'Το {year} σου', en: 'Your {year}' },
  'wrapped.tapHint': { el: 'Πάτα δεξιά για συνέχεια', en: 'Tap the right side to continue' },
  'wrapped.totalLabel': { el: 'Φέτος έδωσες σε συνδρομές', en: 'This year you spent' },
  'wrapped.totalText': {
    el: 'σε {count} χρεώσεις, δηλαδή περίπου {perDay} τη μέρα.',
    en: 'across {count} charges, about {perDay} a day.',
  },
  'wrapped.topLabel': { el: 'Εκεί έδωσες τα περισσότερα', en: 'Where most of it went' },
  'wrapped.topText': {
    el: '{amount} σε {count} χρεώσεις.',
    en: '{amount} across {count} charges.',
  },
  'wrapped.categoryLabel': { el: 'Η κατηγορία της χρονιάς', en: 'Category of the year' },
  'wrapped.monthLabel': { el: 'Ο πιο ακριβός μήνας', en: 'Your priciest month' },
  'wrapped.monthText': { el: 'Έφυγαν {amount}.', en: '{amount} went out.' },
  'wrapped.movesLabel': { el: 'Οι συνδρομές σου φέτος', en: 'Your subscriptions this year' },
  'wrapped.active': { el: 'ενεργές', en: 'active' },
  'wrapped.added': { el: 'νέες', en: 'new' },
  'wrapped.cancelled': { el: 'ακυρώσεις', en: 'cancelled' },
  'wrapped.savedText': {
    el: 'Με όσες ακύρωσες, γλίτωσες {amount}.',
    en: 'By cancelling, you saved {amount}.',
  },
  'wrapped.shareTitle': { el: 'Το {year} μου σε συνδρομές', en: 'My {year} in subscriptions' },
  'wrapped.shareTotal': { el: 'Σύνολο', en: 'Total' },
  'wrapped.shareTop': { el: 'Η αγαπημένη μου', en: 'My favourite' },
  'wrapped.shareCategory': { el: 'Κατηγορία της χρονιάς', en: 'Category of the year' },
  'wrapped.shareActive': { el: 'Ενεργές συνδρομές', en: 'Active subscriptions' },
  'wrapped.shareSaved': { el: 'Γλίτωσα', en: 'Saved' },
  'wrapped.share': { el: 'Μοιράσου το', en: 'Share it' },
  'wrapped.next': { el: 'Επόμενη', en: 'Next' },
  'wrapped.previous': { el: 'Προηγούμενη', en: 'Previous' },
  'wrapped.emptyTitle': { el: 'Δεν υπάρχουν ακόμα χρεώσεις φέτος', en: 'No charges yet this year' },
  'wrapped.emptyText': {
    el: 'Μόλις περάσουν οι πρώτες χρεώσεις, εδώ θα δεις τη χρονιά σου.',
    en: 'Once your first charges go through, you’ll see your year here.',
  },

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
