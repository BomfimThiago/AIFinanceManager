import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Logo, LogoCompact } from '../../components/ui/Logo';
import { useReceipts } from '../../hooks/useReceipts';
import { useExpenses } from '../../hooks/useExpenses';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { isDark } = useColorMode();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const colors = {
    background: isDark ? '#111827' : '#f3f4f6',
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
    primaryLight: isDark ? '#7c3aed20' : '#ede9fe',
    success: '#22c55e',
    successLight: isDark ? '#22c55e20' : '#dcfce7',
    warning: '#f59e0b',
    warningLight: isDark ? '#f59e0b20' : '#fef3c7',
    info: '#3b82f6',
    infoLight: isDark ? '#3b82f620' : '#dbeafe',
  };

  // Only fetch data when authenticated to avoid 401 errors
  const { data: receipts, isLoading: receiptsLoading, refetch: refetchReceipts } = useReceipts({ enabled: isAuthenticated });
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses({ enabled: isAuthenticated });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchReceipts(), refetchExpenses()]);
    setRefreshing(false);
  };

  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const pendingReceipts = receipts?.filter((r) => r.status === 'processing').length || 0;
  const completedReceipts = receipts?.filter((r) => r.status === 'completed').length || 0;
  const totalReceipts = receipts?.length || 0;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: colors.success, bg: colors.successLight, label: 'Completado', icon: '✓' };
      case 'processing':
        return { color: colors.warning, bg: colors.warningLight, label: 'Procesando', icon: '⏳' };
      case 'failed':
        return { color: '#ef4444', bg: isDark ? '#ef444420' : '#fee2e2', label: 'Error', icon: '✕' };
      default:
        return { color: colors.textSecondary, bg: isDark ? '#6b728020' : '#f3f4f6', label: 'Pendiente', icon: '•' };
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.welcomeContent}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Logo size={80} variant="vertical" textColor={colors.text} />
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>
              Tu asistente financiero personal con IA
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <FeatureCard
              icon="🧾"
              title="Escanea Recibos"
              description="Sube una foto y la IA extrae todos los detalles"
              colors={colors}
            />
            <FeatureCard
              icon="📊"
              title="Rastrea Gastos"
              description="Visualiza tus gastos por categoría"
              colors={colors}
            />
            <FeatureCard
              icon="🎯"
              title="Metas Financieras"
              description="Establece y alcanza tus objetivos de ahorro"
              colors={colors}
            />
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <Link href="/auth" asChild>
              <Button title="Comenzar Gratis" size="large" fullWidth />
            </Link>
            <Text style={[styles.ctaSubtext, { color: colors.textSecondary }]}>
              Sin tarjeta de crédito requerida
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary }]}>
              ¡Hola de nuevo!
            </Text>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {user?.fullName?.split(' ')[0] || 'Usuario'}
            </Text>
          </View>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.avatarText}>
              {(user?.fullName?.charAt(0) || 'U').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Main Balance Card */}
        <View style={[
          styles.balanceCard,
          { backgroundColor: colors.primary },
          Platform.OS === 'ios' && styles.shadowIOS,
          Platform.OS === 'android' && styles.shadowAndroid,
          Platform.OS === 'web' && styles.shadowWeb,
        ]}>
          <Text style={styles.balanceLabel}>Gastos del Mes</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalExpenses)}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>{totalReceipts}</Text>
              <Text style={styles.balanceStatLabel}>Recibos</Text>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>{completedReceipts}</Text>
              <Text style={styles.balanceStatLabel}>Procesados</Text>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>{pendingReceipts}</Text>
              <Text style={styles.balanceStatLabel}>Pendientes</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/receipts')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.quickActionEmoji}>📷</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>Escanear</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary }]}>Recibo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/expenses')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight }]}>
                <Text style={styles.quickActionEmoji}>➕</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>Agregar</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary }]}>Gasto</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/categories')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.infoLight }]}>
                <Text style={styles.quickActionEmoji}>🏷️</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>Categorías</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary }]}>Gestionar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warningLight }]}>
                <Text style={styles.quickActionEmoji}>⚙️</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>Ajustes</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary }]}>Configurar</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad Reciente</Text>
            {receipts && receipts.length > 3 && (
              <Pressable onPress={() => router.push('/receipts')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todo</Text>
              </Pressable>
            )}
          </View>

          {receiptsLoading || expensesLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
            </View>
          ) : receipts && receipts.length > 0 ? (
            <View style={[
              styles.activityList,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Platform.OS === 'ios' && styles.shadowIOSSmall,
              Platform.OS === 'android' && styles.shadowAndroidSmall,
              Platform.OS === 'web' && styles.shadowWebSmall,
            ]}>
              {receipts.slice(0, 3).map((receipt, index) => {
                const statusConfig = getStatusConfig(receipt.status);
                return (
                  <Pressable
                    key={receipt.id}
                    style={({ pressed }) => [
                      styles.activityItem,
                      index < Math.min(receipts.length, 3) - 1 && [styles.activityItemBorder, { borderBottomColor: colors.border }],
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => router.push(`/receipt/${receipt.id}`)}
                  >
                    <View style={[styles.activityIconContainer, { backgroundColor: colors.primaryLight }]}>
                      <Text style={styles.activityIcon}>🧾</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                        {receipt.storeName || 'Tienda Desconocida'}
                      </Text>
                      <View style={[styles.activityStatusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.activityStatusIcon, { color: statusConfig.color }]}>
                          {statusConfig.icon}
                        </Text>
                        <Text style={[styles.activityStatusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                    {receipt.totalAmount !== null && (
                      <Text style={[styles.activityAmount, { color: colors.primary }]}>
                        {formatCurrency(receipt.totalAmount)}
                      </Text>
                    )}
                    <Text style={[styles.activityChevron, { color: colors.textSecondary }]}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Platform.OS === 'ios' && styles.shadowIOSSmall,
            ]}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin actividad reciente</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                ¡Escanea tu primer recibo para comenzar!
              </Text>
              <Button
                title="Escanear Recibo"
                onPress={() => router.push('/receipts')}
                style={{ marginTop: 16 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  colors: { surface: string; text: string; textSecondary: string; border: string; primaryLight: string };
}

function FeatureCard({ icon, title, description, colors }: FeatureCardProps) {
  return (
    <View style={[
      styles.featureCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
      Platform.OS === 'ios' && styles.shadowIOSSmall,
      Platform.OS === 'android' && styles.shadowAndroidSmall,
      Platform.OS === 'web' && styles.shadowWebSmall,
    ]}>
      <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryLight }]}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  desktopContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  // Welcome Screen (Non-authenticated)
  welcomeContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresSection: {
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
  },
  ctaSubtext: {
    fontSize: 14,
    marginTop: 12,
  },
  // Authenticated Dashboard
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingSmall: {
    fontSize: 14,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7c3aed',
  },
  // Balance Card
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  balanceStat: {
    alignItems: 'center',
  },
  balanceStatValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  balanceStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  balanceDivider: {
    width: 1,
    height: 32,
  },
  // Shadows
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  shadowAndroid: {
    elevation: 6,
  },
  shadowWeb: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  shadowIOSSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  shadowAndroidSmall: {
    elevation: 3,
  },
  shadowWebSmall: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  // Quick Actions
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionEmoji: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickActionSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  // Activity List
  activityList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  activityStatusIcon: {
    fontSize: 10,
    fontWeight: '700',
  },
  activityStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  activityChevron: {
    fontSize: 22,
  },
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
