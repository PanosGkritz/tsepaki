import type { SQLiteDatabase } from 'expo-sqlite';
import { processDueCharges } from '../db/charges';
import { getSettings, type AppSettings } from '../db/settings';
import { getSubscriptions } from '../db/subscriptions';
import { getDeviceLanguage, type Language } from '../i18n';
import type { Subscription } from '../types/subscription';
import { getDeviceCurrency } from './currency';
import { addCycle, parseIsoDate, toIsoDate } from './dates';
import { formatEuro, setActiveCurrency } from './format';
import { getMyCost, getOutflow, getShareBreakdown } from './share';
import { getPermissionState, replaceScheduledReminders, type Reminder } from './notifications';

type ReminderSettings = Pick<
  AppSettings,
  'reminderDays' | 'reminderHour' | 'reminderMinute' | 'yearlyReminder' | 'language'
>;

// Η εβδομαδιαία σύνοψη έρχεται κάθε Κυριακή στις 8 το βράδυ, για τη Δευτέρα έως Κυριακή που έρχεται.
const WEEKLY_DAY = 0;
const WEEKLY_HOUR = 20;
const WEEKLY_AHEAD = 2;
const WEEKLY_MAX_NAMES = 4;
// Το «ζήτα τα μερίδια» έρχεται το βράδυ της χρέωσης.
const SHARE_REQUEST_HOUR = 20;

type Templates = {
  weekdayOn: string[];
  today: string[];
  tomorrow: string[];
  onDay: string[];
  manualToday: string[];
  manualTomorrow: string[];
  manualOnDay: string[];
  overdue: string;
  trialToday: string;
  trialTomorrow: string;
  trialOnDay: string;
  categoryTomorrow: Record<string, string>;
  yearly: string;
  groupToday: string;
  groupTomorrow: string;
  groupOnDay: string;
  and: string;
  many: string;
  weeklyTitle: string;
  weeklyBody: string;
  weeklyMore: string;
  shareRequest: string;
  shareGive: string;
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
    trialToday: 'Σήμερα λήγει η δωρεάν δοκιμή και σού τραβάει {amount}.',
    trialTomorrow:
      'Αύριο λήγει η δωρεάν δοκιμή. Μετά σού τραβάει {amount}. Αν δεν τη θες, ακύρωσέ τη σήμερα.',
    trialOnDay: '{day} λήγει η δωρεάν δοκιμή. Μετά σού τραβάει {amount}.',
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
    weeklyTitle: 'Η εβδομάδα σου',
    weeklyBody: 'Την εβδομάδα που έρχεται φεύγουν συνολικά {amount}: {list}.',
    weeklyMore: 'και άλλες {count}',
    shareRequest: 'Πέρασε η χρέωση. Ζήτα τα μερίδια: {list}.',
    shareGive: 'Αύριο χρεώνεται. Δώσε το μερίδιό σου ({amount}) σε όποιον πληρώνει: {name}.',
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
    trialToday: 'Your free trial ends today and {amount} will be charged.',
    trialTomorrow:
      'Your free trial ends tomorrow. After that you’ll be charged {amount}. Cancel today if you don’t want it.',
    trialOnDay: 'Your free trial ends {day}. After that you’ll be charged {amount}.',
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
    weeklyTitle: 'Your week ahead',
    weeklyBody: 'Next week {amount} goes out in total: {list}.',
    weeklyMore: '{count} more',
    shareRequest: 'The charge went through. Ask for the shares: {list}.',
    shareGive: 'It renews tomorrow. Give your share ({amount}) to {name}, who pays for it.',
  },
};

export const YEARLY_EXTRA_DAYS = 7;
// Για τις δωρεάν δοκιμές η υπενθύμιση της προηγούμενης μέρας μπαίνει πάντα.
const TRIAL_REQUIRED_DAY = 1;
const MAX_REMINDERS = 60;

export const REMINDER_DAY_OPTIONS = [{ value: 3 }, { value: 2 }, { value: 1 }, { value: 0 }];

const pad = (value: number) => String(value).padStart(2, '0');

export const formatTime = (hour: number, minute = 0) => `${pad(hour)}:${pad(minute)}`;

// Η ώρα των υπενθυμίσεων σε ώρες με δεκαδικά (10:30 → 10.5), για να περνάει εύκολα παντού.
const toClock = (settings: Pick<ReminderSettings, 'reminderHour' | 'reminderMinute'>) =>
  settings.reminderHour + settings.reminderMinute / 60;

const setClock = (date: Date, clock: number) => {
  const hour = Math.floor(clock);
  date.setHours(hour, Math.round((clock - hour) * 60), 0, 0);
};

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
  setClock(date, hour);
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
  const amount = formatEuro(getOutflow(subscription), language);
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

  const total = group.reduce((sum, subscription) => sum + getOutflow(subscription), 0);
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

const buildTrialReminders = (
  subscriptions: Subscription[],
  settings: ReminderSettings,
  language: Language,
): Reminder[] => {
  const templates = TEMPLATES[language];
  const days = [...new Set([...settings.reminderDays, TRIAL_REQUIRED_DAY])];

  return subscriptions.flatMap((subscription) =>
    days.map((daysBefore) => {
      const amount = formatEuro(subscription.price, language);
      const day = templates.weekdayOn[parseIsoDate(subscription.nextChargeDate).getDay()];
      const template =
        daysBefore === 0
          ? templates.trialToday
          : daysBefore === 1
            ? templates.trialTomorrow
            : templates.trialOnDay;

      return {
        id: `${subscription.id}-trial-${daysBefore}`,
        date: buildReminderDate(subscription.nextChargeDate, daysBefore, toClock(settings)),
        title: subscription.name,
        body: capitalize(fill(template, amount, day)),
      };
    }),
  );
};

const fillList = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

// Όλες οι χρεώσεις μιας συνδρομής μέσα σε ένα διάστημα (π.χ. μια μηνιαία μπορεί να πέσει μία φορά).
const chargeDatesBetween = (subscription: Subscription, fromIso: string, toIso: string) => {
  const dates: string[] = [];
  let date = subscription.nextChargeDate;
  while (date < fromIso) date = addCycle(date, subscription.cycle);
  while (date <= toIso) {
    dates.push(date);
    date = addCycle(date, subscription.cycle);
  }
  return dates;
};

const upcomingSundays = (now: Date, count: number) => {
  const sundays: Date[] = [];
  const date = new Date(now);
  date.setHours(WEEKLY_HOUR, 0, 0, 0);
  date.setDate(date.getDate() + ((7 + WEEKLY_DAY - date.getDay()) % 7));
  if (date <= now) date.setDate(date.getDate() + 7);

  for (let index = 0; index < count; index += 1) {
    sundays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }
  return sundays;
};

const buildWeeklySummaries = (
  subscriptions: Subscription[],
  language: Language,
  now: Date,
): Reminder[] => {
  const templates = TEMPLATES[language];

  return upcomingSundays(now, WEEKLY_AHEAD).flatMap((sunday) => {
    const monday = new Date(sunday);
    monday.setDate(monday.getDate() + 1);
    const nextSunday = new Date(sunday);
    nextSunday.setDate(nextSunday.getDate() + 7);
    const fromIso = toIsoDate(monday);
    const toIso = toIsoDate(nextSunday);

    const items = subscriptions
      .flatMap((subscription) =>
        chargeDatesBetween(subscription, fromIso, toIso).map(() => ({
          name: subscription.name,
          amount: getOutflow(subscription),
        })),
      )
      .sort((a, b) => b.amount - a.amount);

    // Αν δεν φεύγει τίποτα, δεν στέλνουμε τίποτα.
    if (items.length === 0) return [];

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const shown = items.length > WEEKLY_MAX_NAMES ? items.slice(0, WEEKLY_MAX_NAMES - 1) : items;
    const parts = shown.map((item) => `${item.name} ${formatEuro(item.amount, language)}`);
    if (shown.length < items.length) {
      parts.push(templates.weeklyMore.replace('{count}', String(items.length - shown.length)));
    }

    return [
      {
        id: `weekly-${toIsoDate(sunday)}`,
        date: sunday,
        title: templates.weeklyTitle,
        body: fillList(templates.weeklyBody, {
          amount: formatEuro(total, language),
          list: parts.join(', '),
        }),
        tap: { kind: 'home' },
      },
    ];
  });
};

// Κοινές συνδρομές: αν πληρώνεις εσύ, το βράδυ της χρέωσης σου θυμίζω να ζητήσεις τα μερίδια.
// Αν πληρώνει άλλος, την προηγούμενη μέρα σου θυμίζω να του δώσεις το δικό σου.
const buildShareReminders = (
  subscriptions: Subscription[],
  settings: ReminderSettings,
  language: Language,
): Reminder[] => {
  const templates = TEMPLATES[language];

  return subscriptions.flatMap((subscription): Reminder[] => {
    const { share } = subscription;
    if (!share) return [];

    if (share.payer) {
      return [
        {
          id: `${subscription.id}-share-give`,
          date: buildReminderDate(subscription.nextChargeDate, 1, toClock(settings)),
          title: subscription.name,
          body: fillList(templates.shareGive, {
            amount: formatEuro(getMyCost(subscription), language),
            name: share.payer,
          }),
        },
      ];
    }

    const { others } = getShareBreakdown(subscription.price, share);
    const date = parseIsoDate(subscription.nextChargeDate);
    date.setHours(SHARE_REQUEST_HOUR, 0, 0, 0);

    return [
      {
        id: `${subscription.id}-share-ask`,
        date,
        title: subscription.name,
        body: templates.shareRequest.replace(
          '{list}',
          others.map((person) => `${person.name} ${formatEuro(person.amount, language)}`).join(', '),
        ),
        tap: {
          kind: 'share',
          subscriptionId: subscription.id,
          chargeDate: subscription.nextChargeDate,
        },
      },
    ];
  });
};

const nextReminderTime = (hour: number, now: Date) => {
  const date = new Date(now);
  setClock(date, hour);
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
  const trials = subscriptions.filter((subscription) => subscription.isTrial);
  // Όσες πληρώνει άλλος δεν χρεώνονται στη δική σου κάρτα: γι' αυτές έρχεται μόνο το «δώσε το μερίδιό σου».
  const regular = subscriptions.filter(
    (subscription) => !subscription.isTrial && !subscription.share?.payer,
  );

  const grouped = [...groupByChargeDate(regular).entries()].flatMap(([chargeDate, group]) =>
    settings.reminderDays.map((daysBefore) =>
      buildGroupReminder(chargeDate, group, daysBefore, toClock(settings), language),
    ),
  );

  const yearly = settings.yearlyReminder
    ? buildYearlyReminders(regular, toClock(settings), language)
    : [];

  const overdue = buildOverdueReminders(regular, toClock(settings), language, now);
  const trialReminders = buildTrialReminders(trials, settings, language);
  const shared = buildShareReminders(
    subscriptions.filter((subscription) => !subscription.isTrial),
    settings,
    language,
  );
  const weekly = buildWeeklySummaries(subscriptions, language, now);

  return [...trialReminders, ...overdue, ...shared, ...grouped, ...yearly, ...weekly]
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
    setActiveCurrency(settings.currency ?? getDeviceCurrency());
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