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
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useReceipts } from '../../hooks/useReceipts';
import { useExpenses } from '../../hooks/useExpenses';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getThemeColors, getStatusConfig, GRADIENTS } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDesktop, isMobile, isSmallMobile, horizontalPadding, width } = useResponsive();
  const { isDark, toggleColorMode } = useColorMode();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const colors = getThemeColors(isDark);

  const { data: receipts, isLoading: receiptsLoading, refetch: refetchReceipts } = useReceipts({ enabled: isAuthenticated });
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses({ enabled: isAuthenticated });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchReceipts(), refetchExpenses()]);
    setRefreshing(false);
  };

  // Calculate total balance from expenses
  const totalBalance = React.useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + (Number(exp.amountEur) || 0), 0);
  }, [expenses]);

  // Calculate this month's expenses
  const thisMonthExpenses = React.useMemo(() => {
    if (!expenses) return 0;
    const now = new Date();
    return expenses
      .filter((exp) => {
        const expDate = new Date(exp.expenseDate);
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, exp) => sum + (Number(exp.amountEur) || 0), 0);
  }, [expenses]);

  // Calculate spending by category
  const spendingByCategory = React.useMemo(() => {
    if (!expenses) return [];
    const categoryTotals: Record<string, { amount: number; icon: string; color: string; name: string }> = {};

    expenses.forEach((exp) => {
      const cat = exp.category || 'other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = {
          amount: 0,
          icon: getCategoryIcon(cat),
          color: getCategoryColor(cat),
          name: getCategoryName(cat),
        };
      }
      categoryTotals[cat].amount += Number(exp.amountEur) || 0;
    });

    return Object.entries(categoryTotals)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [expenses]);

  const totalCategoryAmount = spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0);

  const quickActionWidth = isMobile ? (width - (horizontalPadding * 2) - 12) / 2 : undefined;

  // Welcome screen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={[styles.welcomeContent, { padding: horizontalPadding }]}>
            <View style={styles.heroSection}>
              <Logo size={isSmallMobile ? 60 : 80} variant="vertical" textColor={colors.text} />
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>
                Tu asistente financiero personal con IA
              </Text>
            </View>

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
                description="Visualiza tus gastos por categoria"
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

            <View style={styles.ctaSection}>
              <Link href="/auth" asChild>
                <Pressable style={styles.ctaButtonWrapper}>
                  <LinearGradient
                    colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
                    style={styles.ctaButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.ctaButtonText}>Comenzar Gratis</Text>
                  </LinearGradient>
                </Pressable>
              </Link>
              <Text style={[styles.ctaSubtext, { color: colors.textSecondary }]}>
                Sin tarjeta de credito requerida
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
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
          <View style={[styles.header, { paddingTop: 8 }]}>
            <View>
              <Text style={[styles.greetingSmall, { color: colors.textSecondary, fontSize: isSmallMobile ? 12 : 14 }]}>
                Hola de nuevo!
              </Text>
              <View style={styles.greetingRow}>
                <Text style={[styles.greeting, { color: colors.text, fontSize: isSmallMobile ? 22 : 26 }]}>
                  {user?.fullName?.split(' ')[0] || 'Usuario'}
                </Text>
                <Text style={styles.greetingWave}>👋</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={toggleColorMode}
                style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </Pressable>
              <LinearGradient
                colors={GRADIENTS.primary as [string, string]}
                style={[styles.avatarContainer, { width: isSmallMobile ? 40 : 44, height: isSmallMobile ? 40 : 44 }]}
              >
                <Text style={[styles.avatarText, { fontSize: isSmallMobile ? 16 : 18 }]}>
                  {(user?.fullName?.charAt(0) || 'U').toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCardWrapper}>
            <LinearGradient
              colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decorative circles */}
              <View style={styles.balanceCircle1} />
              <View style={styles.balanceCircle2} />

              <Text style={styles.balanceLabel}>Balance Total</Text>
              <Text style={styles.balanceAmount}>
                €{Math.abs(totalBalance).toLocaleString('es-ES', { minimumFractionDigits: 2 }).split(',')[0]}.
                <Text style={styles.balanceAmountCents}>
                  {Math.abs(totalBalance).toLocaleString('es-ES', { minimumFractionDigits: 2 }).split(',')[1] || '00'}
                </Text>
              </Text>

              <View style={styles.balanceStats}>
                <View>
                  <View style={styles.balanceBadge}>
                    <Text style={styles.balanceBadgeText}>↑ 12.5%</Text>
                  </View>
                  <Text style={styles.balanceSubtext}>vs mes anterior</Text>
                </View>
                <View style={styles.balanceRight}>
                  <Text style={styles.balanceRightLabel}>Este mes</Text>
                  <Text style={styles.balanceRightValue}>€{thisMonthExpenses.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: isSmallMobile ? 16 : 18 }]}>
              Acciones Rapidas
            </Text>
            <View style={[styles.quickActionsGrid, { gap: isSmallMobile ? 8 : 12 }]}>
              {[
                { icon: '📷', label: 'Escanear', sub: 'Recibo', gradient: GRADIENTS.primary, route: '/receipts' },
                { icon: '➕', label: 'Agregar', sub: 'Gasto', gradient: GRADIENTS.success, route: '/expenses' },
                { icon: '🏷️', label: 'Categorias', sub: 'Gestionar', gradient: GRADIENTS.info, route: '/categories' },
                { icon: '📊', label: 'Reportes', sub: 'Analizar', gradient: GRADIENTS.warning, route: '/expenses' },
              ].map(({ icon, label, sub, gradient, route }) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.quickAction,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    quickActionWidth && { width: quickActionWidth, minWidth: undefined, flex: undefined },
                    pressed && styles.quickActionPressed,
                    Platform.OS === 'ios' && styles.shadowIOSSmall,
                    Platform.OS === 'android' && styles.shadowAndroidSmall,
                    Platform.OS === 'web' && styles.shadowWebSmall,
                  ]}
                  onPress={() => router.push(route as any)}
                >
                  <LinearGradient
                    colors={gradient as [string, string]}
                    style={[styles.quickActionIcon, { width: isSmallMobile ? 40 : 48, height: isSmallMobile ? 40 : 48 }]}
                  >
                    <Text style={[styles.quickActionEmoji, { fontSize: isSmallMobile ? 18 : 22 }]}>{icon}</Text>
                  </LinearGradient>
                  <Text style={[styles.quickActionLabel, { color: colors.text, fontSize: isSmallMobile ? 13 : 15 }]}>{label}</Text>
                  <Text style={[styles.quickActionSubLabel, { color: colors.textMuted, fontSize: isSmallMobile ? 10 : 12 }]}>{sub}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Spending by Category */}
          {spendingByCategory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Gastos por Categoria</Text>
                <Pressable onPress={() => router.push('/expenses')}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todo</Text>
                </Pressable>
              </View>
              <View style={[
                styles.categoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Platform.OS === 'ios' && styles.shadowIOSSmall,
                Platform.OS === 'android' && styles.shadowAndroidSmall,
                Platform.OS === 'web' && styles.shadowWebSmall,
              ]}>
                {spendingByCategory.map(({ key, name, amount, icon, color }, index) => {
                  const percent = totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0;
                  return (
                    <View key={key} style={[styles.categoryItem, index < spendingByCategory.length - 1 && { marginBottom: 20 }]}>
                      <View style={styles.categoryItemHeader}>
                        <View style={styles.categoryItemLeft}>
                          <View style={[styles.categoryItemIcon, { backgroundColor: color + '20' }]}>
                            <Text style={styles.categoryItemEmoji}>{icon}</Text>
                          </View>
                          <Text style={[styles.categoryItemName, { color: colors.text }]}>{name}</Text>
                        </View>
                        <Text style={[styles.categoryItemAmount, { color: colors.text }]}>€{amount.toFixed(0)}</Text>
                      </View>
                      <View style={[styles.categoryProgress, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.categoryProgressBar, { width: `${percent}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Recent Activity */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
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
                  const statusConfig = getStatusConfig(receipt.status, isDark);
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
                        <View style={styles.activityMeta}>
                          <View style={[styles.activityStatusBadge, { backgroundColor: statusConfig.bg }]}>
                            <Text style={[styles.activityStatusIcon, { color: statusConfig.color }]}>
                              {statusConfig.icon}
                            </Text>
                            <Text style={[styles.activityStatusText, { color: statusConfig.color }]}>
                              {statusConfig.label}
                            </Text>
                          </View>
                          <Text style={[styles.activityTime, { color: colors.textMuted }]}>Hace 2h</Text>
                        </View>
                      </View>
                      {receipt.totalAmount !== null && (
                        <Text style={[styles.activityAmount, { color: colors.primary }]}>
                          {formatCurrency(receipt.totalAmount)}
                        </Text>
                      )}
                      <Text style={[styles.activityChevron, { color: colors.textMuted }]}>›</Text>
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
                  Escanea tu primer recibo para comenzar!
                </Text>
                <Pressable
                  onPress={() => router.push('/receipts')}
                  style={styles.emptyButtonWrapper}
                >
                  <LinearGradient
                    colors={GRADIENTS.primary as [string, string]}
                    style={styles.emptyButton}
                  >
                    <Text style={styles.emptyButtonText}>Escanear Recibo</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Helper functions
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    groceries: '🛒', dining: '🍽️', transportation: '🚗', entertainment: '🎬',
    healthcare: '🏥', housing: '🏠', education: '📚', other: '📦',
    supermercado: '🛒', restaurantes: '🍽️', transporte: '🚗',
  };
  return icons[category.toLowerCase()] || '📦';
}

function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    groceries: '#10B981', dining: '#EC4899', transportation: '#3B82F6',
    entertainment: '#F59E0B', healthcare: '#EF4444', housing: '#8B5CF6',
    education: '#06B6D4', other: '#6B7280',
    supermercado: '#10B981', restaurantes: '#EC4899', transporte: '#3B82F6',
  };
  return categoryColors[category.toLowerCase()] || '#6B7280';
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    groceries: 'Supermercado', dining: 'Restaurantes', transportation: 'Transporte',
    entertainment: 'Entretenimiento', healthcare: 'Salud', housing: 'Hogar',
    education: 'Educacion', other: 'Otros',
    supermercado: 'Supermercado', restaurantes: 'Restaurantes', transporte: 'Transporte',
  };
  return names[category.toLowerCase()] || category;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  colors: ReturnType<typeof getThemeColors>;
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  desktopContent: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  // Welcome Screen
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
  ctaButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaSubtext: {
    fontSize: 14,
    marginTop: 12,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingSmall: {
    fontSize: 14,
    marginBottom: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
  },
  greetingWave: {
    fontSize: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleIcon: {
    fontSize: 18,
  },
  avatarContainer: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Balance Card
  balanceCardWrapper: {
    marginBottom: 24,
  },
  balanceCard: {
    borderRadius: 28,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 20,
    letterSpacing: -1,
  },
  balanceAmountCents: {
    fontSize: 28,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 4,
  },
  balanceBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  balanceSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  balanceRightLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  balanceRightValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
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
    fontWeight: '700',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  quickActionIcon: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionEmoji: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontWeight: '600',
  },
  quickActionSubLabel: {
    marginTop: 2,
  },
  // Category Spending
  categoryCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  categoryItem: {},
  categoryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItemEmoji: {
    fontSize: 16,
  },
  categoryItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoryItemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryProgress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  // Activity List
  activityList: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityIcon: {
    fontSize: 22,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
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
  activityTime: {
    fontSize: 12,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  activityChevron: {
    fontSize: 18,
  },
  // Shadows
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
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 24,
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
    borderRadius: 24,
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
    marginBottom: 16,
  },
  emptyButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
