import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppLock } from '../components/AppLock';
import { ReminderSync } from '../components/ReminderSync';
import { migrateDbIfNeeded } from '../db/migrate';
import { setupNotifications } from '../lib/notifications';
import { PreferencesProvider, usePreferences } from '../providers/PreferencesProvider';

SplashScreen.preventAutoHideAsync();
setupNotifications();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="tsepaki.db" onInit={migrateDbIfNeeded}>
        <PreferencesProvider>
          <ReminderSync />
          <AppLock>
            <AppStack />
          </AppLock>
        </PreferencesProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const AppStack = () => {
  const { colors, isDark } = usePreferences();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="subscriptions" />
        <Stack.Screen name="subscription/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="subscription/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
};