import type { Language } from '../i18n';
import type { Subscription } from '../types/subscription';
import { formatEuro } from './format';
import { getShareBreakdown } from './share';

const TEXTS: Record<Language, { equal: string; custom: string; thanks: string }> = {
  el: {
    equal: 'Γεια! Πέρασε η χρέωση του {service} ({total}). Το μερίδιο του καθενός είναι {amount}.',
    custom: 'Γεια! Πέρασε η χρέωση του {service} ({total}). Τα μερίδια: {list}.',
    thanks: 'Ευχαριστώ!',
  },
  en: {
    equal: 'Hi! The {service} charge went through ({total}). Each share is {amount}.',
    custom: 'Hi! The {service} charge went through ({total}). The shares: {list}.',
    thanks: 'Thanks!',
  },
};

// Το μήνυμα που στέλνει ο χρήστης στους φίλους του για να του δώσουν τα μερίδιά τους.
export const buildShareMessage = (subscription: Subscription, language: Language) => {
  const share = subscription.share;
  if (!share) return '';

  const texts = TEXTS[language];
  const { others } = getShareBreakdown(subscription.price, share);
  const total = formatEuro(subscription.price, language);

  const body =
    share.split === 'equal'
      ? texts.equal
          .replace('{service}', subscription.name)
          .replace('{total}', total)
          .replace('{amount}', formatEuro(others[0]?.amount ?? 0, language))
      : texts.custom
          .replace('{service}', subscription.name)
          .replace('{total}', total)
          .replace(
            '{list}',
            others.map((person) => `${person.name} ${formatEuro(person.amount, language)}`).join(', '),
          );

  return `${body} ${texts.thanks}`;
};
