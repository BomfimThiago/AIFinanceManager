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
  const { isDesktop, isMobile, isSmallMobile, horizontalPadding, width } = useResponsive();
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

  // Calculate quick action width for 2x2 grid on mobile
  const quickActionWidth = isMobile ? (width - (horizontalPadding * 2) - 12) / 2 : undefined;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.welcomeContent, { padding: horizontalPadding }]}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Logo size={isSmallMobile ? 60 : 80} variant="vertical" textColor={colors.text} />
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>
              Tu asistente financiero personal con IA
            </Text>
          </View>

          {/* Features */}
          <View style={[styles.featuresSection, { gap: isSmallMobile ? 12 : 16 }]}>
            <FeatureCard
              icon="🧾"
              title="Escanea Recibos"
              description="Sube una foto y la IA extrae todos los detalles"
              colors={colors}
              isSmall={isSmallMobile}
            />
            <FeatureCard
              icon="📊"
              title="Rastrea Gastos"
              description="Visualiza tus gastos por categoría"
              colors={colors}
              isSmall={isSmallMobile}
            />
            <FeatureCard
              icon="🎯"
              title="Metas Financieras"
              description="Establece y alcanza tus objetivos de ahorro"
              colors={colors}
              isSmall={isSmallMobile}
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
          { paddingHorizontal: horizontalPadding },
          isDesktop && styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary, fontSize: isSmallMobile ? 12 : 14 }]}>
              ¡Hola de nuevo!
            </Text>
            <Text style={[styles.greeting, { color: colors.text, fontSize: isSmallMobile ? 22 : 26 }]}>
              {user?.fullName?.split(' ')[0] || 'Usuario'}
            </Text>
          </View>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight, width: isSmallMobile ? 40 : 48, height: isSmallMobile ? 40 : 48 }]}>
            <Text style={[styles.avatarText, { fontSize: isSmallMobile ? 16 : 20 }]}>
              {(user?.fullName?.charAt(0) || 'U').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: isSmallMobile ? 16 : 18 }]}>Acciones Rápidas</Text>
          <View style={[styles.quickActionsGrid, { gap: isSmallMobile ? 8 : 12 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                quickActionWidth && { width: quickActionWidth, minWidth: undefined, flex: undefined },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/receipts')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight, width: isSmallMobile ? 40 : 48, height: isSmallMobile ? 40 : 48 }]}>
                <Text style={[styles.quickActionEmoji, { fontSize: isSmallMobile ? 18 : 22 }]}>📷</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text, fontSize: isSmallMobile ? 13 : 15 }]}>Escanear</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary, fontSize: isSmallMobile ? 10 : 12 }]}>Recibo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                quickActionWidth && { width: quickActionWidth, minWidth: undefined, flex: undefined },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/expenses')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight, width: isSmallMobile ? 40 : 48, height: isSmallMobile ? 40 : 48 }]}>
                <Text style={[styles.quickActionEmoji, { fontSize: isSmallMobile ? 18 : 22 }]}>➕</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text, fontSize: isSmallMobile ? 13 : 15 }]}>Agregar</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary, fontSize: isSmallMobile ? 10 : 12 }]}>Gasto</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                quickActionWidth && { width: quickActionWidth, minWidth: undefined, flex: undefined },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/categories')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.infoLight, width: isSmallMobile ? 40 : 48, height: isSmallMobile ? 40 : 48 }]}>
                <Text style={[styles.quickActionEmoji, { fontSize: isSmallMobile ? 18 : 22 }]}>🏷️</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text, fontSize: isSmallMobile ? 13 : 15 }]}>Categorías</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary, fontSize: isSmallMobile ? 10 : 12 }]}>Gestionar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.surface, borderColor: colors.border },
                quickActionWidth && { width: quickActionWidth, minWidth: undefined, flex: undefined },
                pressed && styles.quickActionPressed,
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warningLight, width: isSmallMobile ? 40 : 48, height: isSmallMobile ? 40 : 48 }]}>
                <Text style={[styles.quickActionEmoji, { fontSize: isSmallMobile ? 18 : 22 }]}>⚙️</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text, fontSize: isSmallMobile ? 13 : 15 }]}>Ajustes</Text>
              <Text style={[styles.quickActionSubLabel, { color: colors.textSecondary, fontSize: isSmallMobile ? 10 : 12 }]}>Configurar</Text>
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
  isSmall?: boolean;
}

function FeatureCard({ icon, title, description, colors, isSmall }: FeatureCardProps) {
  return (
    <View style={[
      styles.featureCard,
      { backgroundColor: colors.surface, borderColor: colors.border, padding: isSmall ? 14 : 20, gap: isSmall ? 12 : 16 },
      Platform.OS === 'ios' && styles.shadowIOSSmall,
      Platform.OS === 'android' && styles.shadowAndroidSmall,
      Platform.OS === 'web' && styles.shadowWebSmall,
    ]}>
      <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryLight, width: isSmall ? 44 : 52, height: isSmall ? 44 : 52 }]}>
        <Text style={[styles.featureIcon, { fontSize: isSmall ? 20 : 24 }]}>{icon}</Text>
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.text, fontSize: isSmall ? 14 : 16 }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary, fontSize: isSmall ? 12 : 14 }]}>{description}</Text>
      </View>
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
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {},
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
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
