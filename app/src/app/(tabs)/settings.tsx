import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
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
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
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
          <Card style={styles.authCard}>
            <Text style={[styles.authTitle, { color: colors.text }]}>Sin Iniciar Sesión</Text>
            <Text style={[styles.authText, { color: colors.textSecondary }]}>
              Inicia sesión para acceder a la configuración de tu cuenta
            </Text>
            <Button title="Iniciar Sesión" onPress={() => router.push('/auth')} />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        <Card style={styles.profileCard}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Apariencia</Text>
        <Card padding="none">
          <View style={[styles.settingsItem, styles.settingsItemBorder, { borderBottomColor: colors.border }]}>
            <Text style={styles.settingsIcon}>🌙</Text>
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
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Cuenta</Text>
        <Card padding="none">
          <SettingsItem
            icon="👤"
            title="Perfil"
            subtitle="Gestiona la información de tu perfil"
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="🔔"
            title="Notificaciones"
            subtitle="Configura las preferencias de notificaciones"
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="💱"
            title="Moneda"
            subtitle="USD"
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="🌐"
            title="Idioma"
            subtitle="Español"
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Datos</Text>
        <Card padding="none">
          <SettingsItem
            icon="📤"
            title="Exportar Datos"
            subtitle="Descarga tus datos de gastos"
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="🗑️"
            title="Borrar Datos"
            subtitle="Elimina todos los datos locales"
            onPress={() => {}}
            colors={colors}
            isLast
            isDanger
          />
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Acerca de</Text>
        <Card padding="none">
          <SettingsItem
            icon="ℹ️"
            title="Versión"
            subtitle="1.0.0"
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="📜"
            title="Política de Privacidad"
            subtitle=""
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="📋"
            title="Términos de Servicio"
            subtitle=""
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </Card>

        <Button
          title="Cerrar Sesión"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: { text: string; textSecondary: string; border: string };
  isLast?: boolean;
  isDanger?: boolean;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  colors,
  isLast,
  isDanger,
}: SettingsItemProps) {
  return (
    <Pressable
      style={[styles.settingsItem, !isLast && [styles.settingsItemBorder, { borderBottomColor: colors.border }]]}
      onPress={onPress}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: isDanger ? '#ef4444' : colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
    </Pressable>
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
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  authCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    marginBottom: 24,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
  },
  logoutButton: {
    marginTop: 32,
  },
});
