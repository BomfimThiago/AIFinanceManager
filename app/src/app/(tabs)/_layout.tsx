import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { Logo } from '../../components/ui/Logo';
import { HamburgerMenu } from '../../components/navigation/HamburgerMenu';

export default function TabsLayout() {
  const { isDark } = useColorMode();
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);

  // Use hamburger menu for small screens (< 400px)
  const useHamburger = width < 400;
  const isSmallScreen = width < 500;

  const colors = {
    primary: '#7c3aed',
    textMuted: isDark ? '#9ca3af' : '#6b7280',
    surface: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#e5e7eb',
    textPrimary: isDark ? '#f9fafb' : '#111827',
  };

  // Custom header with hamburger button for small screens
  const renderHeader = (title: string, showLogo: boolean = false) => {
    if (!useHamburger) return undefined;

    return () => (
      <View style={[styles.customHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.hamburgerButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </Pressable>
        {showLogo ? (
          <Logo size={26} variant="horizontal" textColor={colors.textPrimary} />
        ) : (
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
        )}
        <View style={styles.headerSpacer} />
      </View>
    );
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          // Hide tab bar on small screens - use hamburger instead
          tabBarStyle: useHamburger ? { display: 'none' } : {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? 20 : 6,
            paddingTop: 6,
            height: Platform.OS === 'ios' ? 85 : 60,
          },
          tabBarLabelStyle: {
            fontSize: isSmallScreen ? 10 : 11,
            fontWeight: '500',
          },
          headerStyle: useHamburger ? { height: 0 } : {
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
            header: useHamburger ? renderHeader('', true) : undefined,
            headerTitle: useHamburger ? undefined : () => (
              <View style={{ marginLeft: Platform.OS === 'ios' ? 0 : -16 }}>
                <Logo size={30} variant="horizontal" textColor={colors.textPrimary} />
              </View>
            ),
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="receipts"
          options={{
            title: 'Recibos',
            header: renderHeader('Recibos'),
            tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Gastos',
            header: renderHeader('Gastos'),
            tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categorías',
            header: renderHeader('Categorías'),
            tabBarLabel: isSmallScreen ? 'Categ.' : 'Categorías',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            header: renderHeader('Ajustes'),
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          }}
        />
      </Tabs>

      {/* Hamburger Menu Modal */}
      <HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
});
