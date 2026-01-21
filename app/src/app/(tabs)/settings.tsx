// src/app/(tabs)/settings.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getTheme, radius, getShadow, colors, gradients } from '../../constants/theme';

interface SettingItemProps {
  icon: string;
  iconGradient?: string[];
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  theme: ReturnType<typeof getTheme>;
}

function SettingItem({ icon, iconGradient, title, subtitle, rightElement, onPress, theme }: SettingItemProps) {
  const content = (
    <View style={styles.settingItem}>
      {iconGradient ? (
        <LinearGradient colors={iconGradient as [string, string]} style={styles.settingIcon}>
          <Text style={styles.settingEmoji}>{icon}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
          <Text style={styles.settingEmoji}>{icon}</Text>
        </View>
      )}
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isDesktop, horizontalPadding } = useResponsive();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleColorMode } = useColorMode();
  const theme = getTheme(isDark);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  // Unauthenticated State
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Dark Mode Card */}
          <Card variant="glass" padding="none" style={{ marginBottom: 16 }}>
            <SettingItem
              icon="🌙"
              title="Modo Oscuro"
              subtitle={isDark ? 'Activado' : 'Desactivado'}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleColorMode}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                  thumbColor="#FFFFFF"
                />
              }
              theme={theme}
            />
          </Card>

          {/* Login Prompt */}
          <Card variant="gradientBorder" style={styles.authCard}>
            <Text style={styles.authIcon}>🔐</Text>
            <Text style={[styles.authTitle, { color: theme.text }]}>Sin Iniciar Sesión</Text>
            <Text style={[styles.authSubtitle, { color: theme.textSecondary }]}>
              Inicia sesión para acceder a más opciones
            </Text>
            <Link href="/auth" asChild>
              <Button title="Iniciar Sesión" fullWidth />
            </Link>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
          isDesktop && styles.desktopContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <LinearGradient colors={gradients.primary as [string, string, ...string[]]} style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || '?'}</Text>
          </LinearGradient>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.fullName}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
          <Pressable style={[styles.editProfileBtn, { borderColor: theme.border }]}>
            <Text style={[styles.editProfileText, { color: theme.primary }]}>Editar Perfil</Text>
          </Pressable>
        </Card>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>APARIENCIA</Text>
        <Card variant="glass" padding="none" style={{ marginBottom: 24 }}>
          <SettingItem
            icon="🌙"
            iconGradient={gradients.secondary}
            title="Modo Oscuro"
            subtitle={isDark ? 'Activado' : 'Desactivado'}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleColorMode}
                trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                thumbColor="#FFFFFF"
              />
            }
            theme={theme}
          />
        </Card>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>CUENTA</Text>
        <Card variant="glass" padding="none" style={{ marginBottom: 24 }}>
          <SettingItem
            icon="🔔"
            iconGradient={gradients.warning}
            title="Notificaciones"
            subtitle="Gestionar alertas"
            rightElement={<Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>}
            onPress={() => {}}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingItem
            icon="🔒"
            iconGradient={gradients.success}
            title="Seguridad"
            subtitle="Contraseña y autenticación"
            rightElement={<Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>}
            onPress={() => {}}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingItem
            icon="💳"
            iconGradient={gradients.primarySimple}
            title="Métodos de Pago"
            subtitle="Gestionar tarjetas"
            rightElement={<Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>}
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        {/* Support Section */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SOPORTE</Text>
        <Card variant="glass" padding="none" style={{ marginBottom: 24 }}>
          <SettingItem
            icon="❓"
            title="Centro de Ayuda"
            rightElement={<Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>}
            onPress={() => {}}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingItem
            icon="📧"
            title="Contactar Soporte"
            rightElement={<Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>}
            onPress={() => {}}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingItem
            icon="⭐"
            title="Calificar App"
            rightElement={<Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>}
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        {/* Logout Button */}
        <Button title="Cerrar Sesión" variant="danger" onPress={handleLogout} fullWidth />

        {/* Version */}
        <Text style={[styles.version, { color: theme.textMuted }]}>Konta v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 16 },
  desktopContent: { maxWidth: 500, alignSelf: 'center', width: '100%' },
  // Profile Card
  profileCard: { alignItems: 'center', padding: 28, marginBottom: 24 },
  avatarLarge: { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 16 },
  editProfileBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 2 },
  editProfileText: { fontSize: 14, fontWeight: '600' },
  // Section
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  // Setting Item
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  settingIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingEmoji: { fontSize: 20 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 22 },
  divider: { height: 1, marginLeft: 74 },
  // Auth Card
  authCard: { alignItems: 'center', padding: 32 },
  authIcon: { fontSize: 48, marginBottom: 16 },
  authTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  authSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  // Version
  version: { textAlign: 'center', fontSize: 12, marginTop: 24, marginBottom: 16 },
});
