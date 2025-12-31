import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useReceipts } from '../../hooks/useReceipts';
import { useExpenses } from '../../hooks/useExpenses';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';

export default function DashboardScreen() {
  const { isDesktop } = useResponsive();
  const { isDark } = useColorMode();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const colors = {
    background: isDark ? '#111827' : '#f3f4f6',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    primary: '#7c3aed',
    accent: '#3b82f6',
    warning: '#f59e0b',
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Bienvenido a Konta</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Controla tus gastos fácilmente con escaneo de recibos con IA
          </Text>
          <Link href="/auth" asChild>
            <Button title="Comenzar" />
          </Link>
        </View>
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
        <Text style={[styles.greeting, { color: colors.text }]}>
          ¡Hola, {user?.fullName?.split(' ')[0] || 'usuario'}!
        </Text>

        <View style={[styles.statsGrid, isDesktop && styles.desktopGrid]}>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gastos Totales</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{formatCurrency(totalExpenses)}</Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>Este mes</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recibos</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{completedReceipts}</Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>Procesados</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {pendingReceipts}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>Procesando</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones Rápidas</Text>
          <View style={styles.actionsRow}>
            <Link href="/receipts" asChild>
              <Button title="📷 Escanear Recibo" style={styles.actionButton} />
            </Link>
            <Link href="/expenses" asChild>
              <Button
                title="➕ Agregar Gasto"
                variant="outline"
                style={styles.actionButton}
              />
            </Link>
          </View>
          <View style={[styles.actionsRow, { marginTop: 12 }]}>
            <Link href="/categories" asChild>
              <Button
                title="🏷️ Gestionar Categorías"
                variant="outline"
                style={styles.actionButton}
              />
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad Reciente</Text>
          {receiptsLoading || expensesLoading ? (
            <Card>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
            </Card>
          ) : receipts && receipts.length > 0 ? (
            receipts.slice(0, 3).map((receipt) => (
              <Link key={receipt.id} href={`/receipt/${receipt.id}`} asChild>
                <Card style={styles.activityCard}>
                  <View style={styles.activityRow}>
                    <Text style={styles.activityIcon}>🧾</Text>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: colors.text }]}>
                        {receipt.storeName || 'Tienda Desconocida'}
                      </Text>
                      <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]}>
                        {receipt.status}
                      </Text>
                    </View>
                    {receipt.totalAmount && (
                      <Text style={[styles.activityAmount, { color: colors.accent }]}>
                        {formatCurrency(receipt.totalAmount)}
                      </Text>
                    )}
                  </View>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Sin actividad reciente. ¡Escanea un recibo para comenzar!
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  desktopGrid: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    minWidth: 100,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  activityCard: {
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  activitySubtitle: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
