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

export default function DashboardScreen() {
  const { isDesktop } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.welcomeTitle}>Welcome to AI Finance Manager</Text>
          <Text style={styles.welcomeSubtitle}>
            Track your expenses effortlessly with AI-powered receipt scanning
          </Text>
          <Link href="/auth" asChild>
            <Button title="Get Started" />
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.greeting}>
          Hello, {user?.fullName?.split(' ')[0] || 'there'}!
        </Text>

        <View style={[styles.statsGrid, isDesktop && styles.desktopGrid]}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.statSubtext}>This month</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Receipts</Text>
            <Text style={styles.statValue}>{completedReceipts}</Text>
            <Text style={styles.statSubtext}>Processed</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {pendingReceipts}
            </Text>
            <Text style={styles.statSubtext}>Processing</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <Link href="/receipts" asChild>
              <Button title="📷 Scan Receipt" style={styles.actionButton} />
            </Link>
            <Link href="/expenses" asChild>
              <Button
                title="➕ Add Expense"
                variant="outline"
                style={styles.actionButton}
              />
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {receiptsLoading || expensesLoading ? (
            <Card>
              <Text style={styles.loadingText}>Loading...</Text>
            </Card>
          ) : receipts && receipts.length > 0 ? (
            receipts.slice(0, 3).map((receipt) => (
              <Link key={receipt.id} href={`/receipt/${receipt.id}`} asChild>
                <Card style={styles.activityCard}>
                  <View style={styles.activityRow}>
                    <Text style={styles.activityIcon}>🧾</Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {receipt.storeName || 'Unknown Store'}
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        {receipt.status}
                      </Text>
                    </View>
                    {receipt.totalAmount && (
                      <Text style={styles.activityAmount}>
                        {formatCurrency(receipt.totalAmount)}
                      </Text>
                    )}
                  </View>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>
                No recent activity. Scan a receipt to get started!
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
    backgroundColor: '#f3f4f6',
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
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
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
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
    color: '#1f2937',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  loadingText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
});
