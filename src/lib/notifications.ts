import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

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
    Notifications.setNotificationChannelAsync('charges', {
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

export const sendTestNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Τσεπάκι',
      body: 'Έτσι θα σου θυμίζω τις χρεώσεις. Σε 2 μέρες σού τραβάει 13,99 € το Netflix.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: 'charges',
    },
  });
};