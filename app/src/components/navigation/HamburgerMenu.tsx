import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { path: '/', label: 'Inicio', icon: '🏠' },
  { path: '/receipts', label: 'Recibos', icon: '🧾' },
  { path: '/expenses', label: 'Gastos', icon: '💰' },
  { path: '/categories', label: 'Categorías', icon: '🏷️' },
  { path: '/settings', label: 'Ajustes', icon: '⚙️' },
];

export function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useColorMode();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  const colors = {
    overlay: 'rgba(0, 0, 0, 0.5)',
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    primary: '#7c3aed',
    primaryLight: isDark ? '#7c3aed30' : '#ede9fe',
    border: isDark ? '#374151' : '#e5e7eb',
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 150);
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose} />

        {/* Menu */}
        <Animated.View
          style={[
            styles.menu,
            {
              backgroundColor: colors.surface,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {MENU_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <Pressable
                  key={item.path}
                  style={[
                    styles.menuItem,
                    active && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleNavigate(item.path)}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuLabel,
                      { color: active ? colors.primary : colors.text },
                      active && { fontWeight: '600' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {active && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    width: 280,
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '2px 0 10px rgba(0,0,0,0.25)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    flex: 1,
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
});
