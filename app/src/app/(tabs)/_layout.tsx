import { Tabs } from 'expo-router';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { Logo } from '../../components/ui/Logo';

export default function TabsLayout() {
  const { isDark } = useColorMode();
  const { width } = useWindowDimensions();
  const isVerySmall = width < 340;  // iPhone SE, very small devices
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
          fontSize: isVerySmall ? 8 : isSmallScreen ? 9 : 11,
          fontWeight: '500',
          marginTop: isVerySmall ? -2 : 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: isVerySmall ? 2 : isSmallScreen ? 4 : 8,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? (isVerySmall ? 16 : 20) : (isVerySmall ? 4 : 6),
          paddingTop: isVerySmall ? 4 : 6,
          height: Platform.OS === 'ios' ? (isVerySmall ? 75 : 85) : (isVerySmall ? 52 : 60),
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
              <Logo size={isVerySmall ? 22 : isSmallScreen ? 26 : 30} variant="horizontal" textColor={colors.textPrimary} />
            </View>
          ),
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} size={isVerySmall ? 16 : isSmallScreen ? 18 : 22} />,
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Recibos',
          tabBarLabel: isVerySmall ? 'Recib.' : 'Recibos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" focused={focused} size={isVerySmall ? 16 : isSmallScreen ? 18 : 22} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} size={isVerySmall ? 16 : isSmallScreen ? 18 : 22} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorías',
          tabBarLabel: isVerySmall ? 'Cat.' : isSmallScreen ? 'Categ.' : 'Categorías',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} size={isVerySmall ? 16 : isSmallScreen ? 18 : 22} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarLabel: isVerySmall ? 'Ajust.' : 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} size={isVerySmall ? 16 : isSmallScreen ? 18 : 22} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, focused, size }: { emoji: string; focused: boolean; size: number }) {
  return (
    <Text style={{ fontSize: size, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}
