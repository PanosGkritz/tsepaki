import type { SQLiteDatabase } from 'expo-sqlite';
import { processDueCharges } from '../db/charges';
import { getSettings, type AppSettings } from '../db/settings';
import { getSubscriptions } from '../db/subscriptions';
import type { Subscription } from '../types/subscription';
import { parseIsoDate } from './dates';
import { formatEuro } from './format';
import { getPermissionState, replaceScheduledReminders, type Reminder } from './notifications';

type ReminderSettings = Pick<AppSettings, 'reminderDays' | 'reminderHour' | 'yearlyReminder'>;

export const YEARLY_EXTRA_DAYS = 7;
const MAX_REMINDERS = 60;

export const REMINDER_DAY_OPTIONS = [
  { value: 3, label: '3 μέρες πριν' },
  { value: 2, label: '2 μέρες πριν' },
  { value: 1, label: 'Την προηγούμενη' },
  { value: 0, label: 'Την ημέρα' },
];

export const REMINDER_HOUR_OPTIONS = [8, 9, 10, 12, 18, 20];

export const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

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

const buildReminderDate = (chargeDate: string, daysBefore: number, hour: number) => {
  const date = parseIsoDate(chargeDate);
  date.setDate(date.getDate() - daysBefore);
  date.setHours(hour, 0, 0, 0);
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
  hour: number,
): Reminder => {
  const id = `${chargeDate}-${daysBefore}`;
  const date = buildReminderDate(chargeDate, daysBefore, hour);
  const day = capitalize(WEEKDAY_ON[parseIsoDate(chargeDate).getDay()]);
  const payload =
    daysBefore === 0
      ? { subscriptionIds: group.map((subscription) => subscription.id), chargeDate }
      : undefined;
  const single = group.length === 1 ? group[0] : undefined;

  if (single) {
    return {
      id,
      date,
      title: single.name,
      body: buildSingleBody(single, daysBefore, day, id),
      payload,
    };
  }

  const total = group.reduce((sum, subscription) => sum + subscription.price, 0);
  return { id, date, title: joinNames(group), body: buildGroupBody(total, daysBefore, day), payload };
};

const groupByChargeDate = (subscriptions: Subscription[]) => {
  const groups = new Map<string, Subscription[]>();
  for (const subscription of subscriptions) {
    const group = groups.get(subscription.nextChargeDate) ?? [];
    groups.set(subscription.nextChargeDate, [...group, subscription]);
  }
  return groups;
};

const buildYearlyReminders = (subscriptions: Subscription[], hour: number): Reminder[] =>
  subscriptions
    .filter((subscription) => subscription.cycle === 'yearly')
    .map((subscription) => ({
      id: `${subscription.id}-${YEARLY_EXTRA_DAYS}`,
      date: buildReminderDate(subscription.nextChargeDate, YEARLY_EXTRA_DAYS, hour),
      title: subscription.name,
      body: fill(YEARLY_TEMPLATE, formatEuro(subscription.price)),
    }));

export const buildReminders = (
  subscriptions: Subscription[],
  settings: ReminderSettings,
  now = new Date(),
): Reminder[] => {
  const grouped = [...groupByChargeDate(subscriptions).entries()].flatMap(([chargeDate, group]) =>
    settings.reminderDays.map((daysBefore) =>
      buildGroupReminder(chargeDate, group, daysBefore, settings.reminderHour),
    ),
  );

  const yearly = settings.yearlyReminder
    ? buildYearlyReminders(subscriptions, settings.reminderHour)
    : [];

  return [...grouped, ...yearly]
    .filter((reminder) => reminder.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_REMINDERS);
};

const runSync = async (db: SQLiteDatabase) => {
  try {
    await processDueCharges(db);
  } catch {
    // Αν αποτύχει η καταγραφή, συνεχίζουμε με τις ειδοποιήσεις.
  }

  try {
    if ((await getPermissionState()) !== 'granted') return;
    const [subscriptions, settings] = await Promise.all([getSubscriptions(db), getSettings(db)]);
    await replaceScheduledReminders(buildReminders(subscriptions, settings));
  } catch {
    // Αν αποτύχουν οι ειδοποιήσεις, η υπόλοιπη εφαρμογή συνεχίζει κανονικά.
  }
};

let queue = Promise.resolve();

export const syncReminders = (db: SQLiteDatabase) => {
  queue = queue.then(() => runSync(db));
  return queue;
};