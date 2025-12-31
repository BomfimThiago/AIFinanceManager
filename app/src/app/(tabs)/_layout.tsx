import { Tabs } from 'expo-router';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { Logo } from '../../components/ui/Logo';

export default function TabsLayout() {
  const { isDark } = useColorMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  const colors = {
    primary: '#7c3aed',
    textMuted: isDark ? '#9ca3af' : '#6b7280',
    surface: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#e5e7eb',
    textPrimary: isDark ? '#f9fafb' : '#111827',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 10 : 11,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerTitle: () => (
            <View style={{ marginLeft: Platform.OS === 'ios' ? 0 : -16 }}>
              <Logo size={isSmallScreen ? 26 : 30} variant="horizontal" textColor={colors.textPrimary} />
            </View>
          ),
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} small={isSmallScreen} />,
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Recibos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" focused={focused} small={isSmallScreen} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} small={isSmallScreen} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorías',
          tabBarLabel: isSmallScreen ? 'Categ.' : 'Categorías',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} small={isSmallScreen} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} small={isSmallScreen} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, focused, small }: { emoji: string; focused: boolean; small?: boolean }) {
  return (
    <Text style={{ fontSize: small ? 20 : 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}
