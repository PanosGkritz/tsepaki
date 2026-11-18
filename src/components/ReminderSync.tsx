import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncReminders } from '../lib/reminders';

export const ReminderSync = () => {
  const db = useSQLiteContext();

  useEffect(() => {
    syncReminders(db);

    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncReminders(db);
    });

    return () => listener.remove();
  }, [db]);

  return null;
};