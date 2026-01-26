// src/app/(tabs)/index.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card, GradientCard } from '../../components/ui/Card';
import { Logo } from '../../components/ui/Logo';
import { useReceipts } from '../../hooks/useReceipts';
import { useExpenses } from '../../hooks/useExpenses';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getTheme, radius, getShadow, colors, gradients } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDesktop, isMobile, isSmallMobile, horizontalPadding, width } = useResponsive();
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: receiptData, isLoading: receiptsLoading, refetch: refetchReceipts } = useReceipts({ enabled: isAuthenticated });
  const { data: expenseData, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses({ enabled: isAuthenticated });

  const receipts = receiptData?.items || [];
  const expenses = expenseData?.items || [];
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchReceipts(), refetchExpenses()]);
    setRefreshing(false);
  };

  const quickActions = [
    { icon: '📷', label: 'Escanear', sub: 'Recibo', gradient: gradients.primarySimple, route: '/receipts' },
    { icon: '➕', label: 'Agregar', sub: 'Gasto', gradient: gradients.success, route: '/expenses' },
    { icon: '🏷️', label: 'Categorías', sub: 'Gestionar', gradient: gradients.secondary, route: '/categories' },
    { icon: '⚙️', label: 'Ajustes', sub: 'Configurar', gradient: gradients.warning, route: '/settings' },
  ];

  const statusConfig = {
    completed: { color: colors.success.main, bg: 'rgba(16,185,129,0.15)', label: 'Completado', icon: '✓' },
    processing: { color: colors.warning.main, bg: 'rgba(245,158,11,0.15)', label: 'Procesando', icon: '⏳' },
    failed: { color: colors.danger.main, bg: 'rgba(239,68,68,0.15)', label: 'Error', icon: '✕' },
  };

  // Calculate total balance from expenses
  const totalBalance = React.useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + (Number(exp.amountEur) || 0), 0);
  }, [expenses]);

  // Unauthenticated Welcome Screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={[styles.welcomeContent, { padding: horizontalPadding }]}>
          <View style={styles.heroSection}>
            <Logo size={isSmallMobile ? 60 : 80} variant="vertical" textColor={theme.text} />
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
              Tu asistente financiero personal con IA
            </Text>
          </View>

          <View style={styles.featuresSection}>
            {[
              { icon: '🧾', title: 'Escanea Recibos', desc: 'Sube una foto y la IA extrae todos los detalles' },
              { icon: '📊', title: 'Rastrea Gastos', desc: 'Visualiza tus gastos por categoría' },
              { icon: '🎯', title: 'Metas Financieras', desc: 'Establece y alcanza tus objetivos' },
            ].map((feature, i) => (
              <Card key={i} variant="glass" style={styles.featureCard}>
                <View style={styles.featureRow}>
                  <LinearGradient colors={gradients.primarySimple} style={styles.featureIcon}>
                    <Text style={styles.featureEmoji}>{feature.icon}</Text>
                  </LinearGradient>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{feature.desc}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          <View style={styles.ctaSection}>
            <Link href="/auth" asChild>
              <Button title="Comenzar Gratis" size="large" fullWidth />
            </Link>
            <Text style={[styles.ctaSubtext, { color: theme.textSecondary }]}>
              Sin tarjeta de crédito requerida
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSmall, { color: theme.textSecondary }]}>¡Hola de nuevo!</Text>
            <Text style={[styles.greeting, { color: theme.text }]}>
              {user?.fullName?.split(' ')[0] || 'Usuario'} 👋
            </Text>
          </View>
          <LinearGradient colors={gradients.primarySimple} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName?.charAt(0) || 'U').toUpperCase()}
            </Text>
          </LinearGradient>
        </View>

        {/* Balance Card */}
        <GradientCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Total</Text>
          <Text style={styles.balanceAmount}>€{Math.abs(totalBalance).toLocaleString('es-ES', { minimumFractionDigits: 2 }).split(',')[0]}.<Text style={styles.balanceCents}>{Math.abs(totalBalance).toLocaleString('es-ES', { minimumFractionDigits: 2 }).split(',')[1] || '00'}</Text></Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceTrend}>
              <Text style={styles.balanceTrendText}>↑ 12.5%</Text>
            </View>
            <Text style={styles.balanceTrendLabel}>vs mes anterior</Text>
          </View>
        </GradientCard>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(({ icon, label, sub, gradient, route }) => (
              <Pressable
                key={label}
                onPress={() => router.push(route as any)}
                style={({ pressed }) => [
                  styles.quickAction,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                  getShadow('sm'),
                ]}
              >
                <LinearGradient colors={gradient} style={styles.quickActionIcon}>
                  <Text style={styles.quickActionEmoji}>{icon}</Text>
                </LinearGradient>
                <Text style={[styles.quickActionLabel, { color: theme.text }]}>{label}</Text>
                <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>{sub}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Actividad Reciente</Text>
            {receipts && receipts.length > 3 && (
              <Pressable onPress={() => router.push('/receipts')}>
                <Text style={[styles.seeAll, { color: theme.primary }]}>Ver todo</Text>
              </Pressable>
            )}
          </View>

          {receiptsLoading || expensesLoading ? (
            <Card variant="glass" style={styles.loadingCard}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Cargando...</Text>
            </Card>
          ) : receipts && receipts.length > 0 ? (
            <Card variant="glass" padding="none">
              {receipts.slice(0, 3).map((receipt, i) => {
                const status = statusConfig[receipt.status as keyof typeof statusConfig] || statusConfig.processing;
                return (
                  <Pressable
                    key={receipt.id}
                    onPress={() => router.push(`/receipt/${receipt.id}`)}
                    style={[
                      styles.activityItem,
                      i < Math.min(receipts.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
                    ]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: theme.primaryLight }]}>
                      <Text style={styles.activityEmoji}>🧾</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
                        {receipt.storeName || 'Tienda Desconocida'}
                      </Text>
                      <View style={[styles.activityBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.activityBadgeText, { color: status.color }]}>
                          {status.icon} {status.label}
                        </Text>
                      </View>
                    </View>
                    {receipt.totalAmount !== null && (
                      <Text style={[styles.activityAmount, { color: theme.primary }]}>
                        {formatCurrency(receipt.totalAmount)}
                      </Text>
                    )}
                    <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
                  </Pressable>
                );
              })}
            </Card>
          ) : (
            <Card variant="glass" style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin actividad reciente</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                ¡Escanea tu primer recibo para comenzar!
              </Text>
              <Button title="Escanear Recibo" onPress={() => router.push('/receipts')} style={{ marginTop: 16 }} />
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingVertical: 16 },
  // Welcome
  welcomeContent: { flexGrow: 1, justifyContent: 'center' },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  welcomeSubtitle: { fontSize: 18, textAlign: 'center', marginTop: 16, lineHeight: 26 },
  featuresSection: { gap: 16, marginBottom: 40 },
  featureCard: { padding: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureEmoji: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 14 },
  ctaSection: { alignItems: 'center' },
  ctaSubtext: { fontSize: 14, marginTop: 12 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingSmall: { fontSize: 14, marginBottom: 2 },
  greeting: { fontSize: 26, fontWeight: '700' },
  avatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  // Balance Card
  balanceCard: { marginBottom: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  balanceAmount: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', marginTop: 8, letterSpacing: -1 },
  balanceCents: { fontSize: 28 },
  balanceStats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  balanceTrend: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  balanceTrendText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  balanceTrendLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  // Quick Actions
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickAction: { flex: 1, minWidth: 140, padding: 16, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 15, fontWeight: '600' },
  quickActionSub: { fontSize: 12, marginTop: 2 },
  // Activity
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  activityIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activityEmoji: { fontSize: 22 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  activityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activityBadgeText: { fontSize: 11, fontWeight: '600' },
  activityAmount: { fontSize: 16, fontWeight: '700' },
  chevron: { fontSize: 22 },
  // Loading/Empty
  loadingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingText: { fontSize: 14 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
