import type { SQLiteDatabase } from 'expo-sqlite';
import { getSubscriptions } from '../db/subscriptions';
import type { Subscription } from '../types/subscription';
import { parseIsoDate } from './dates';
import { formatEuro } from './format';
import { getPermissionState, replaceScheduledReminders, type Reminder } from './notifications';

export const REMINDER_DAYS = [3, 2, 1, 0];
export const YEARLY_EXTRA_DAYS = 7;
export const REMINDER_HOUR = 10;
export const REMINDER_SUMMARY =
  'Σου θυμίζω 3 και 2 μέρες πριν, την προηγούμενη μέρα και το πρωί της χρέωσης, στις 10:00. Για τις ετήσιες συνδρομές και μία εβδομάδα πριν.';
const MAX_REMINDERS = 60;

const WEEKDAY_ON = [
  'την Κυριακή',
  'τη Δευτέρα',
  'την Τρίτη',
  'την Τετάρτη',
  'την Πέμπτη',
  'την Παρασκευή',
  'το Σάββατο',
];

const TODAY_TEMPLATES = [
  'Σήμερα σού τραβάει {amount}.',
  'Σήμερα φεύγουν {amount}. Έχεις αρκετά στην κάρτα;',
  'Σήμερα είναι η μέρα, πάνε {amount}.',
];

const TOMORROW_TEMPLATES = [
  'Αύριο σού τραβάει {amount}.',
  'Αύριο φεύγουν {amount}.',
  'Ετοιμάσου, αύριο πάνε {amount}.',
];

const DAY_TEMPLATES = ['{day} σού τραβάει {amount}.', '{day} φεύγουν {amount}.'];

const CATEGORY_TOMORROW: Record<string, string> = {
  Streaming: 'Αύριο {amount} για να μη σου κόψει τη σειρά στη μέση.',
  Μουσική: 'Αύριο {amount} για να συνεχίσει να παίζει η μουσική.',
  Gaming: 'Αύριο {amount}. Συνέχισε να παίζεις.',
  AI: 'Ο βοηθός σου ανανεώνεται αύριο, {amount}.',
  Αποθήκευση: 'Αύριο {amount} για να μη γεμίσει ο χώρος σου.',
  Κινητό: 'Αύριο {amount} για το κινητό σου.',
  TV: 'Αύριο {amount} για την τηλεόραση.',
};

const YEARLY_TEMPLATE = 'Σε μια βδομάδα ανανεώνεται για όλο τον χρόνο: {amount}.';

const fill = (template: string, amount: string, day = '') =>
  template.replace('{amount}', amount).replace('{day}', day);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const pickVariant = (options: string[], seed: string) => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
};

const joinNames = (subscriptions: Subscription[]) => {
  if (subscriptions.length > 3) return `${subscriptions.length} συνδρομές`;
  const names = subscriptions.map((subscription) => subscription.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} και ${names[names.length - 1]}`;
};

const buildReminderDate = (chargeDate: string, daysBefore: number) => {
  const date = parseIsoDate(chargeDate);
  date.setDate(date.getDate() - daysBefore);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
};

const buildSingleBody = (subscription: Subscription, daysBefore: number, day: string, seed: string) => {
  const amount = formatEuro(subscription.price);

  if (daysBefore === 0) return fill(pickVariant(TODAY_TEMPLATES, seed), amount);

  if (daysBefore === 1) {
    const flavor = CATEGORY_TOMORROW[subscription.category];
    const options = flavor ? [...TOMORROW_TEMPLATES, flavor] : TOMORROW_TEMPLATES;
    return fill(pickVariant(options, seed), amount);
  }

  return fill(pickVariant(DAY_TEMPLATES, seed), amount, day);
};

const buildGroupBody = (total: number, daysBefore: number, day: string) => {
  const amount = formatEuro(total);
  if (daysBefore === 0) return `Σήμερα φεύγουν συνολικά ${amount}.`;
  if (daysBefore === 1) return `Αύριο φεύγουν συνολικά ${amount}.`;
  return `${day} φεύγουν συνολικά ${amount}.`;
};

const buildGroupReminder = (
  chargeDate: string,
  group: Subscription[],
  daysBefore: number,
): Reminder => {
  const id = `${chargeDate}-${daysBefore}`;
  const date = buildReminderDate(chargeDate, daysBefore);
  const day = capitalize(WEEKDAY_ON[parseIsoDate(chargeDate).getDay()]);
  const single = group.length === 1 ? group[0] : undefined;

  if (single) {
    return { id, date, title: single.name, body: buildSingleBody(single, daysBefore, day, id) };
  }

  const total = group.reduce((sum, subscription) => sum + subscription.price, 0);
  return { id, date, title: joinNames(group), body: buildGroupBody(total, daysBefore, day) };
};

const groupByChargeDate = (subscriptions: Subscription[]) => {
  const groups = new Map<string, Subscription[]>();
  for (const subscription of subscriptions) {
    const group = groups.get(subscription.nextChargeDate) ?? [];
    groups.set(subscription.nextChargeDate, [...group, subscription]);
  }
  return groups;
};

const buildYearlyReminders = (subscriptions: Subscription[]): Reminder[] =>
  subscriptions
    .filter((subscription) => subscription.cycle === 'yearly')
    .map((subscription) => ({
      id: `${subscription.id}-${YEARLY_EXTRA_DAYS}`,
      date: buildReminderDate(subscription.nextChargeDate, YEARLY_EXTRA_DAYS),
      title: subscription.name,
      body: fill(YEARLY_TEMPLATE, formatEuro(subscription.price)),
    }));

export const buildReminders = (subscriptions: Subscription[], now = new Date()): Reminder[] => {
  const grouped = [...groupByChargeDate(subscriptions).entries()].flatMap(([chargeDate, group]) =>
    REMINDER_DAYS.map((daysBefore) => buildGroupReminder(chargeDate, group, daysBefore)),
  );

  return [...grouped, ...buildYearlyReminders(subscriptions)]
    .filter((reminder) => reminder.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_REMINDERS);
};

const runSync = async (db: SQLiteDatabase) => {
  try {
    if ((await getPermissionState()) !== 'granted') return;
    const subscriptions = await getSubscriptions(db);
    await replaceScheduledReminders(buildReminders(subscriptions));
  } catch {
    // Αν αποτύχουν οι ειδοποιήσεις, η υπόλοιπη εφαρμογή συνεχίζει κανονικά.
  }
};

let queue = Promise.resolve();

export const syncReminders = (db: SQLiteDatabase) => {
  queue = queue.then(() => runSync(db));
  return queue;
};