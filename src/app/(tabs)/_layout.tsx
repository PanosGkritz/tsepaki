import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { type ColorValue, StyleSheet, View } from 'react-native';
import { colors, fonts } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type TabIconProps = { color: ColorValue; size: number };

const tabIcon =
  (name: IconName) =>
  ({ color, size }: TabIconProps) => (
    <Ionicons name={name} size={size} color={typeof color === 'string' ? color : undefined} />
  );

const AddTabIcon = () => (
  <View style={styles.addButton}>
    <Ionicons name="add" size={28} color={colors.onAccent} />
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentBright,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Αρχική', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Ημερολόγιο', tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Προσθήκη',
          tabBarLabel: () => null,
          tabBarIcon: AddTabIcon,
          tabBarAccessibilityLabel: 'Προσθήκη συνδρομής',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Ιστορικό', tabBarIcon: tabIcon('time-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ρυθμίσεις', tabBarIcon: tabIcon('settings-outline') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 88,
    paddingTop: 8,
  },
  tabLabel: { fontFamily: fonts.medium, fontSize: 11 },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
