import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useResponsive } from '../../hooks/useResponsive';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
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
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          <Card style={styles.authCard}>
            <Text style={styles.authTitle}>Not Logged In</Text>
            <Text style={styles.authText}>
              Sign in to access your account settings
            </Text>
            <Button title="Sign In" onPress={() => router.push('/auth')} />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Account</Text>
        <Card padding="none">
          <SettingsItem
            icon="👤"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => {}}
          />
          <SettingsItem
            icon="🔔"
            title="Notifications"
            subtitle="Configure notification preferences"
            onPress={() => {}}
          />
          <SettingsItem
            icon="💱"
            title="Currency"
            subtitle="USD"
            onPress={() => {}}
          />
          <SettingsItem
            icon="🌐"
            title="Language"
            subtitle="English"
            onPress={() => {}}
            isLast
          />
        </Card>

        <Text style={styles.sectionTitle}>Data</Text>
        <Card padding="none">
          <SettingsItem
            icon="📤"
            title="Export Data"
            subtitle="Download your expense data"
            onPress={() => {}}
          />
          <SettingsItem
            icon="🗑️"
            title="Clear Data"
            subtitle="Remove all local data"
            onPress={() => {}}
            isLast
            isDanger
          />
        </Card>

        <Text style={styles.sectionTitle}>About</Text>
        <Card padding="none">
          <SettingsItem
            icon="ℹ️"
            title="Version"
            subtitle="1.0.0"
            onPress={() => {}}
          />
          <SettingsItem
            icon="📜"
            title="Privacy Policy"
            subtitle=""
            onPress={() => {}}
          />
          <SettingsItem
            icon="📋"
            title="Terms of Service"
            subtitle=""
            onPress={() => {}}
            isLast
          />
        </Card>

        <Button
          title="Logout"
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
  isLast?: boolean;
  isDanger?: boolean;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  isLast,
  isDanger,
}: SettingsItemProps) {
  return (
    <Pressable
      style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
      onPress={onPress}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, isDanger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#3b82f6',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
    borderBottomColor: '#e5e7eb',
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
    color: '#1f2937',
  },
  settingsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#9ca3af',
  },
  dangerText: {
    color: '#ef4444',
  },
  logoutButton: {
    marginTop: 32,
  },
});
