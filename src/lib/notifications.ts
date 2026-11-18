import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export type Reminder = {
  id: string;
  date: Date;
  title: string;
  body: string;
};

const CHANNEL_ID = 'charges';

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

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Υπενθυμίσεις χρεώσεων',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
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
      content: { title: reminder.title, body: reminder.body },
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
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tsepaki',
      body: 'Έτσι θα σου θυμίζω τις χρεώσεις. Αύριο σού τραβάει 13,99 € το Netflix.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
};