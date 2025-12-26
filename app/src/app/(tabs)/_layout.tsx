import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuthStore } from '../../store/authStore';

export default function TabsLayout() {
  const { isDesktop } = useResponsive();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect unauthenticated users to auth page (except for dashboard which shows welcome screen)
  // Individual screens handle showing auth prompts if needed

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...(isDesktop && {
            maxWidth: 1200,
            alignSelf: 'center',
            width: '100%',
          }),
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1f2937',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Receipts',
          tabBarIcon: ({ color }) => <TabIcon emoji="🧾" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TabIcon emoji="💰" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <span style={{ fontSize: 24, opacity: color === '#3b82f6' ? 1 : 0.6 }}>
      {emoji}
    </span>
  );
}
