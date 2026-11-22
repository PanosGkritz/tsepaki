import type { ShareInfo, SharePerson, Subscription } from '../types/subscription';

export type ShareAmount = { name: string; amount: number };

export type ShareBreakdown = {
  mine: number;
  others: ShareAmount[];
};

const round = (value: number) => Math.round(value * 100) / 100;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toPerson = (value: unknown): SharePerson | null => {
  if (!isRecord(value) || typeof value.name !== 'string' || !value.name.trim()) return null;
  const amount = typeof value.amount === 'number' && value.amount >= 0 ? value.amount : undefined;
  return { name: value.name.trim(), amount };
};

// Το JSON της στήλης share. Ό,τι δεν διαβάζεται σωστά αγνοείται, σαν να μην είναι κοινή.
export const parseShare = (text: string | null): ShareInfo | undefined => {
  if (!text) return undefined;

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (!isRecord(data) || !Array.isArray(data.people)) return undefined;
  const people = data.people.map(toPerson).filter((person) => person !== null);
  if (people.length === 0) return undefined;

  return {
    people,
    split: data.split === 'custom' ? 'custom' : 'equal',
    payer:
      typeof data.payer === 'string' && people.some((person) => person.name === data.payer)
        ? data.payer
        : null,
  };
};

export const serializeShare = (share?: ShareInfo) =>
  share && share.people.length > 0 ? JSON.stringify(share) : null;

// Στα «Ίσα» τα δεκαδικά που περισσεύουν πάνε στο δικό σου μερίδιο, ώστε το σύνολο να βγαίνει ακριβώς.
export const getShareBreakdown = (price: number, share: ShareInfo): ShareBreakdown => {
  if (share.split === 'equal') {
    const each = round(price / (share.people.length + 1));
    const others = share.people.map((person) => ({ name: person.name, amount: each }));
    return { mine: round(price - each * share.people.length), others };
  }

  const others = share.people.map((person) => ({
    name: person.name,
    amount: round(person.amount ?? 0),
  }));
  const othersTotal = others.reduce((sum, person) => sum + person.amount, 0);
  return { mine: round(Math.max(price - othersTotal, 0)), others };
};

// Πόσα βγάζεις εσύ από την τσέπη σου για αυτή τη συνδρομή σε κάθε χρέωση.
export const getMyCost = (subscription: Subscription) =>
  subscription.share
    ? getShareBreakdown(subscription.price, subscription.share).mine
    : subscription.price;

// Πόσα φεύγουν από την κάρτα σου τη μέρα της χρέωσης: όλο το ποσό αν πληρώνεις εσύ,
// μόνο το μερίδιό σου αν πληρώνει άλλος.
export const getOutflow = (subscription: Subscription) =>
  subscription.share?.payer ? getMyCost(subscription) : subscription.price;

// Για τα σύνολα: το μερίδιό σου, ή όλο το ποσό αν το έχει ζητήσει ο χρήστης.
export const getCountedCost = (subscription: Subscription, countFullShared: boolean) =>
  countFullShared ? subscription.price : getMyCost(subscription);

export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('');

// Σταθερό χρώμα ανά όνομα, ώστε ο Γιώργος να έχει πάντα το ίδιο κυκλάκι.
const AVATAR_COLORS = ['#3B82F6', '#E8590C', '#9C36B5', '#0C8599', '#C2255C', '#5C940D', '#E67700'];

export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const joinPeople = (names: string[], and: string) => {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
};
