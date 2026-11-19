import type { Language } from '../i18n';

const GREETINGS: Record<Language, { morning: string; afternoon: string; evening: string }> = {
  el: { morning: 'Καλημέρα', afternoon: 'Καλησπέρα', evening: 'Καλό βράδυ' },
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
};

export const getGreeting = (language: Language, date = new Date()) => {
  const hour = date.getHours();
  const words = GREETINGS[language];
  if (hour >= 5 && hour < 12) return words.morning;
  if (hour >= 12 && hour < 21) return words.afternoon;
  return words.evening;
};

export const buildGreeting = (name: string, language: Language, date = new Date()) => {
  const greeting = getGreeting(language, date);
  const trimmedName = name.trim();
  return trimmedName ? `${greeting}, ${trimmedName}` : greeting;
};