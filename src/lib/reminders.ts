import type { SQLiteDatabase } from 'expo-sqlite';
import { processDueCharges } from '../db/charges';
import { getSettings, type AppSettings } from '../db/settings';
import { getSubscriptions } from '../db/subscriptions';
import { getDeviceLanguage, type Language } from '../i18n';
import type { Subscription } from '../types/subscription';
import { parseIsoDate, toIsoDate } from './dates';
import { formatEuro } from './format';
import { getPermissionState, replaceScheduledReminders, type Reminder } from './notifications';

type ReminderSettings = Pick<
  AppSettings,
  'reminderDays' | 'reminderHour' | 'yearlyReminder' | 'language'
>;

type Templates = {
  weekdayOn: string[];
  today: string[];
  tomorrow: string[];
  onDay: string[];
  manualToday: string[];
  manualTomorrow: string[];
  manualOnDay: string[];
  overdue: string;
  categoryTomorrow: Record<string, string>;
  yearly: string;
  groupToday: string;
  groupTomorrow: string;
  groupOnDay: string;
  and: string;
  many: string;
};

const TEMPLATES: Record<Language, Templates> = {
  el: {
    weekdayOn: [
      'την Κυριακή',
      'τη Δευτέρα',
      'την Τρίτη',
      'την Τετάρτη',
      'την Πέμπτη',
      'την Παρασκευή',
      'το Σάββατο',
    ],
    today: [
      'Σήμερα σού τραβάει {amount}.',
      'Σήμερα φεύγουν {amount}. Έχεις αρκετά στην κάρτα;',
      'Σήμερα είναι η μέρα, πάνε {amount}.',
    ],
    tomorrow: [
      'Αύριο σού τραβάει {amount}.',
      'Αύριο φεύγουν {amount}.',
      'Ετοιμάσου, αύριο πάνε {amount}.',
    ],
    onDay: ['{day} σού τραβάει {amount}.', '{day} φεύγουν {amount}.'],
    manualToday: ['Σήμερα πληρώνεις {amount}.', 'Σήμερα είναι η μέρα να πληρώσεις {amount}.'],
    manualTomorrow: ['Αύριο πληρώνεις {amount}.', 'Μην το ξεχάσεις, αύριο πληρώνεις {amount}.'],
    manualOnDay: ['{day} πληρώνεις {amount}.'],
    overdue: 'Μήπως ξέχασες να το πληρώσεις; Ήταν {amount} στις {date}.',
    categoryTomorrow: {
      streaming: 'Αύριο {amount} για να μη σου κόψει τη σειρά στη μέση.',
      music: 'Αύριο {amount} για να συνεχίσει να παίζει η μουσική.',
      gaming: 'Αύριο {amount}. Συνέχισε να παίζεις.',
      ai: 'Ο βοηθός σου ανανεώνεται αύριο, {amount}.',
      storage: 'Αύριο {amount} για να μη γεμίσει ο χώρος σου.',
      mobile: 'Αύριο {amount} για το κινητό σου.',
      tv: 'Αύριο {amount} για την τηλεόραση.',
      activities: 'Αύριο {amount} για τη δραστηριότητά σου.',
    },
    yearly: 'Σε μια βδομάδα ανανεώνεται για όλο τον χρόνο: {amount}.',
    groupToday: 'Σήμερα φεύγουν συνολικά {amount}.',
    groupTomorrow: 'Αύριο φεύγουν συνολικά {amount}.',
    groupOnDay: '{day} φεύγουν συνολικά {amount}.',
    and: 'και',
    many: '{count} συνδρομές',
  },
  en: {
    weekdayOn: [
      'on Sunday',
      'on Monday',
      'on Tuesday',
      'on Wednesday',
      'on Thursday',
      'on Friday',
      'on Saturday',
    ],
    today: [
      'Today you’ll be charged {amount}.',
      'Today {amount} goes out. Enough on your card?',
      'It’s today: {amount} is on its way out.',
    ],
    tomorrow: [
      'Tomorrow you’ll be charged {amount}.',
      'Tomorrow {amount} goes out.',
      'Heads up, {amount} goes out tomorrow.',
    ],
    onDay: ['You’ll be charged {amount} {day}.', '{amount} goes out {day}.'],
    manualToday: ['Payment due today: {amount}.', 'Today’s the day to pay {amount}.'],
    manualTomorrow: ['Payment due tomorrow: {amount}.', 'Don’t forget, you pay {amount} tomorrow.'],
    manualOnDay: ['{amount} to pay {day}.'],
    overdue: 'Forgot to pay? {amount} was due on {date}.',
    categoryTomorrow: {
      streaming: 'Tomorrow {amount}, so your show doesn’t stop mid-season.',
      music: 'Tomorrow {amount} to keep the music playing.',
      gaming: 'Tomorrow {amount}. Keep playing.',
      ai: 'Your assistant renews tomorrow: {amount}.',
      storage: 'Tomorrow {amount} so your storage doesn’t fill up.',
      mobile: 'Tomorrow {amount} for your phone plan.',
      tv: 'Tomorrow {amount} for your TV.',
      activities: 'Tomorrow {amount} for your activity.',
    },
    yearly: 'Renews in one week for the whole year: {amount}.',
    groupToday: 'Today {amount} goes out in total.',
    groupTomorrow: 'Tomorrow {amount} goes out in total.',
    groupOnDay: 'In total, {amount} goes out {day}.',
    and: 'and',
    many: '{count} subscriptions',
  },
};

export const YEARLY_EXTRA_DAYS = 7;
const MAX_REMINDERS = 60;

export const REMINDER_DAY_OPTIONS = [{ value: 3 }, { value: 2 }, { value: 1 }, { value: 0 }];

export const REMINDER_HOUR_OPTIONS = [8, 9, 10, 12, 18, 20];

export const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

const fill = (template: string, amount: string, day = '') =>
  template.replace('{amount}', amount).replace('{day}', day);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const formatShortDate = (iso: string) => {
  const date = parseIsoDate(iso);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const pickVariant = (options: string[], seed: string) => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
};

const joinNames = (subscriptions: Subscription[], templates: Templates) => {
  if (subscriptions.length > 3) return templates.many.replace('{count}', String(subscriptions.length));
  const names = subscriptions.map((subscription) => subscription.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} ${templates.and} ${names[names.length - 1]}`;
};

const buildReminderDate = (chargeDate: string, daysBefore: number, hour: number) => {
  const date = parseIsoDate(chargeDate);
  date.setDate(date.getDate() - daysBefore);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const buildSingleBody = (
  subscription: Subscription,
  daysBefore: number,
  day: string,
  seed: string,
  templates: Templates,
  language: Language,
) => {
  const amount = formatEuro(subscription.price, language);
  const isManual = subscription.paymentMode === 'manual';

  if (daysBefore === 0) {
    return fill(pickVariant(isManual ? templates.manualToday : templates.today, seed), amount);
  }

  if (daysBefore === 1) {
    const base = isManual ? templates.manualTomorrow : templates.tomorrow;
    const flavor = templates.categoryTomorrow[subscription.category];
    const options = flavor ? [...base, flavor] : base;
    return fill(pickVariant(options, seed), amount);
  }

  const options = isManual ? templates.manualOnDay : templates.onDay;
  return capitalize(fill(pickVariant(options, seed), amount, day));
};

const buildGroupBody = (
  total: number,
  daysBefore: number,
  day: string,
  templates: Templates,
  language: Language,
) => {
  const amount = formatEuro(total, language);
  if (daysBefore === 0) return fill(templates.groupToday, amount);
  if (daysBefore === 1) return fill(templates.groupTomorrow, amount);
  return capitalize(fill(templates.groupOnDay, amount, day));
};

const buildGroupReminder = (
  chargeDate: string,
  group: Subscription[],
  daysBefore: number,
  hour: number,
  language: Language,
): Reminder => {
  const templates = TEMPLATES[language];
  const id = `${chargeDate}-${daysBefore}`;
  const date = buildReminderDate(chargeDate, daysBefore, hour);
  const day = templates.weekdayOn[parseIsoDate(chargeDate).getDay()];
  // Το κουμπί «Το πλήρωσα» μπαίνει μόνο για όσες πληρώνει ο χρήστης μόνος του.
  const manualIds = group
    .filter((subscription) => subscription.paymentMode === 'manual')
    .map((subscription) => subscription.id);
  const payload =
    daysBefore === 0 && manualIds.length > 0 ? { subscriptionIds: manualIds, chargeDate } : undefined;
  const single = group.length === 1 ? group[0] : undefined;

  if (single) {
    return {
      id,
      date,
      title: single.name,
      body: buildSingleBody(single, daysBefore, day, id, templates, language),
      payload,
    };
  }

  const total = group.reduce((sum, subscription) => sum + subscription.price, 0);
  return {
    id,
    date,
    title: joinNames(group, templates),
    body: buildGroupBody(total, daysBefore, day, templates, language),
    payload,
  };
};

const groupByChargeDate = (subscriptions: Subscription[]) => {
  const groups = new Map<string, Subscription[]>();
  for (const subscription of subscriptions) {
    const group = groups.get(subscription.nextChargeDate) ?? [];
    groups.set(subscription.nextChargeDate, [...group, subscription]);
  }
  return groups;
};

const buildYearlyReminders = (
  subscriptions: Subscription[],
  hour: number,
  language: Language,
): Reminder[] =>
  subscriptions
    .filter((subscription) => subscription.cycle === 'yearly')
    .map((subscription) => ({
      id: `${subscription.id}-${YEARLY_EXTRA_DAYS}`,
      date: buildReminderDate(subscription.nextChargeDate, YEARLY_EXTRA_DAYS, hour),
      title: subscription.name,
      body: fill(TEMPLATES[language].yearly, formatEuro(subscription.price, language)),
    }));

const nextReminderTime = (hour: number, now: Date) => {
  const date = new Date(now);
  date.setHours(hour, 0, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 1);
  return date;
};

const buildOverdueReminders = (
  subscriptions: Subscription[],
  hour: number,
  language: Language,
  now: Date,
): Reminder[] => {
  const todayIso = toIsoDate(now);

  return subscriptions
    .filter(
      (subscription) =>
        subscription.paymentMode === 'manual' && subscription.nextChargeDate < todayIso,
    )
    .map((subscription) => ({
      id: `${subscription.id}-overdue`,
      date: nextReminderTime(hour, now),
      title: subscription.name,
      body: TEMPLATES[language].overdue
        .replace('{amount}', formatEuro(subscription.price, language))
        .replace('{date}', formatShortDate(subscription.nextChargeDate)),
      payload: { subscriptionIds: [subscription.id], chargeDate: subscription.nextChargeDate },
    }));
};

export const resolveLanguage = (settings: Pick<AppSettings, 'language'>) =>
  settings.language ?? getDeviceLanguage();

export const buildReminders = (
  subscriptions: Subscription[],
  settings: ReminderSettings,
  now = new Date(),
): Reminder[] => {
  const language = resolveLanguage(settings);

  const grouped = [...groupByChargeDate(subscriptions).entries()].flatMap(([chargeDate, group]) =>
    settings.reminderDays.map((daysBefore) =>
      buildGroupReminder(chargeDate, group, daysBefore, settings.reminderHour, language),
    ),
  );

  const yearly = settings.yearlyReminder
    ? buildYearlyReminders(subscriptions, settings.reminderHour, language)
    : [];

  const overdue = buildOverdueReminders(subscriptions, settings.reminderHour, language, now);

  return [...overdue, ...grouped, ...yearly]
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
    await replaceScheduledReminders(
      buildReminders(subscriptions, settings),
      resolveLanguage(settings),
    );
  } catch {
    // Αν αποτύχουν οι ειδοποιήσεις, η υπόλοιπη εφαρμογή συνεχίζει κανονικά.
  }
};

let queue = Promise.resolve();

export const syncReminders = (db: SQLiteDatabase) => {
  queue = queue.then(() => runSync(db));
  return queue;
};