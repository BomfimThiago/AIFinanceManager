import React from 'react';
import { View, Text, StyleSheet, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useColorMode } from '../../providers/GluestackUIProvider';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleColorMode } = useColorMode();

  const colors = {
    background: isDark ? '#111827' : '#f3f4f6',
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
    primaryLight: isDark ? '#7c3aed20' : '#ede9fe',
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          {/* Dark Mode Card - Available without login */}
          <View style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            Platform.OS === 'ios' && styles.shadowIOS,
            Platform.OS === 'android' && styles.shadowAndroid,
            Platform.OS === 'web' && styles.shadowWeb,
          ]}>
            <View style={styles.settingsItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.icon}>🌙</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={[styles.settingsTitle, { color: colors.text }]}>Modo Oscuro</Text>
                <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleColorMode}
                trackColor={{ false: '#d1d5db', true: '#7c3aed' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Login Prompt */}
          <View style={[
            styles.card,
            styles.authCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            Platform.OS === 'ios' && styles.shadowIOS,
            Platform.OS === 'android' && styles.shadowAndroid,
            Platform.OS === 'web' && styles.shadowWeb,
          ]}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Sin Iniciar Sesión</Text>
            <Text style={[styles.authText, { color: colors.textSecondary }]}>
              Inicia sesión para acceder a más opciones
            </Text>
            <Button title="Iniciar Sesión" onPress={() => router.push('/auth')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        {/* Profile Card */}
        <View style={[
          styles.card,
          styles.profileCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          Platform.OS === 'ios' && styles.shadowIOS,
          Platform.OS === 'android' && styles.shadowAndroid,
          Platform.OS === 'web' && styles.shadowWeb,
        ]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        {/* Dark Mode Setting */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Apariencia</Text>
        <View style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          Platform.OS === 'ios' && styles.shadowIOS,
          Platform.OS === 'android' && styles.shadowAndroid,
          Platform.OS === 'web' && styles.shadowWeb,
        ]}>
          <View style={styles.settingsItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.icon}>🌙</Text>
            </View>
            <View style={styles.settingsContent}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>Modo Oscuro</Text>
              <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>
                {isDark ? 'Activado' : 'Desactivado'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleColorMode}
              trackColor={{ false: '#d1d5db', true: '#7c3aed' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Logout Button */}
        <Button
          title="Cerrar Sesión"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutButton}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  desktopContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  shadowAndroid: {
    elevation: 4,
  },
  shadowWeb: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  // Auth Card
  authCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  // Profile Card
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // Logout
  logoutButton: {
    marginTop: 32,
  },
});
