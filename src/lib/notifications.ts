import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export type ChargePayload = {
  subscriptionIds: string[];
  chargeDate: string;
};

export type Reminder = {
  id: string;
  date: Date;
  title: string;
  body: string;
  payload?: ChargePayload;
};

export const PAID_ACTION = 'paid';

const CHANNEL_ID = 'charges';
const CHARGE_DAY_CATEGORY = 'charge-day';

const toPermissionState = (status: string): PermissionState => {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
};

export const setupNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  Notifications.setNotificationCategoryAsync(CHARGE_DAY_CATEGORY, [
    {
      identifier: PAID_ACTION,
      buttonTitle: 'Το πλήρωσα',
      options: { opensAppToForeground: true },
    },
  ]);

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Υπενθυμίσεις χρεώσεων',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
};

export const readChargePayload = (data: unknown): ChargePayload | null => {
  if (typeof data !== 'object' || data === null) return null;
  if (!('subscriptionIds' in data) || !('chargeDate' in data)) return null;

  const { subscriptionIds, chargeDate } = data;
  if (!Array.isArray(subscriptionIds) || typeof chargeDate !== 'string') return null;

  const ids = subscriptionIds.filter((id): id is string => typeof id === 'string');
  return { subscriptionIds: ids, chargeDate };
};

export const getPermissionState = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  return toPermissionState(status);
};

export const requestPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) return toPermissionState(current.status);

  const { status } = await Notifications.requestPermissionsAsync();
  return toPermissionState(status);
};

export const replaceScheduledReminders = async (reminders: Reminder[]) => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        ...(reminder.payload && {
          data: reminder.payload,
          categoryIdentifier: CHARGE_DAY_CATEGORY,
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId: CHANNEL_ID,
      },
    });
  }
};

export const getScheduledCount = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
};

export const sendTestNotification = async () => {
  const testPayload: ChargePayload = { subscriptionIds: [], chargeDate: '' };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tsepaki',
      body: 'Έτσι θα σου θυμίζω τις χρεώσεις. Σήμερα σού τραβάει 13,99 € το Netflix.',
      data: testPayload,
      categoryIdentifier: CHARGE_DAY_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
};