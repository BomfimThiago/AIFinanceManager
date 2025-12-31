import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { useReceipt } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';
import { useColorMode } from '../../providers/GluestackUIProvider';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { isDark } = useColorMode();
  const { data: receipt, isLoading, error } = useReceipt(Number(id));

  const colors = {
    background: isDark ? '#111827' : '#f3f4f6',
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
    divider: isDark ? '#374151' : '#e5e7eb',
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIcon, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando recibo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !receipt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Error</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            No se pudo cargar el recibo
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusConfig = () => {
    switch (receipt.status) {
      case 'completed':
        return { color: '#22c55e', bg: isDark ? '#22c55e20' : '#dcfce7', label: 'Completado', icon: '✓' };
      case 'processing':
        return { color: '#f59e0b', bg: isDark ? '#f59e0b20' : '#fef3c7', label: 'Procesando', icon: '⏳' };
      case 'failed':
        return { color: '#ef4444', bg: isDark ? '#ef444420' : '#fee2e2', label: 'Error', icon: '✕' };
      default:
        return { color: '#6b7280', bg: isDark ? '#6b728020' : '#f3f4f6', label: 'Pendiente', icon: '•' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
      >
        {/* Main Info Card */}
        <View style={[
          styles.mainCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          Platform.OS === 'ios' && styles.shadowIOS,
          Platform.OS === 'android' && styles.shadowAndroid,
          Platform.OS === 'web' && styles.shadowWeb,
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.storeName, { color: colors.text }]}>
                {receipt.storeName || 'Tienda Desconocida'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusIcon, { color: statusConfig.color }]}>{statusConfig.icon}</Text>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
            {receipt.totalAmount !== null && (
              <View style={styles.amountContainer}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                  {formatCurrency(receipt.totalAmount, receipt.currency as any)}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <DetailRow
              icon="📅"
              label="Fecha de compra"
              value={receipt.purchaseDate ? formatDateTime(receipt.purchaseDate) : 'Desconocida'}
              colors={colors}
            />
            <DetailRow
              icon="💱"
              label="Moneda"
              value={receipt.currency}
              colors={colors}
            />
            <DetailRow
              icon="📤"
              label="Subido"
              value={formatDateTime(receipt.createdAt)}
              colors={colors}
            />
          </View>
        </View>

        {/* Items Section */}
        {receipt.expenses && receipt.expenses.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Artículos</Text>
              <View style={[styles.itemCount, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.itemCountText, { color: colors.primary }]}>
                  {receipt.expenses.length}
                </Text>
              </View>
            </View>

            <View style={[
              styles.itemsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Platform.OS === 'ios' && styles.shadowIOS,
              Platform.OS === 'android' && styles.shadowAndroid,
              Platform.OS === 'web' && styles.shadowWeb,
            ]}>
              {receipt.expenses.map((expense, index) => {
                const expenseCategoryInfo = getCategoryInfo(expense.category);
                return (
                  <View
                    key={expense.id}
                    style={[
                      styles.itemRow,
                      index < receipt.expenses.length - 1 && [styles.itemBorder, { borderBottomColor: colors.divider }],
                    ]}
                  >
                    <View style={[styles.itemCategoryIcon, { backgroundColor: expenseCategoryInfo.color + '20' }]}>
                      <Text style={styles.itemCategoryEmoji}>{expenseCategoryInfo.icon}</Text>
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemName, { color: colors.text }]}>{expense.description}</Text>
                      <Text style={[styles.itemCategory, { color: expenseCategoryInfo.color }]}>
                        {expenseCategoryInfo.label}
                      </Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: colors.text }]}>
                      {formatCurrency(expense.amount, expense.currency as any)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Empty items state */}
        {(!receipt.expenses || receipt.expenses.length === 0) && receipt.status === 'completed' && (
          <View style={[styles.emptyItems, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin artículos</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No se encontraron artículos en este recibo
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  colors: { text: string; textSecondary: string };
}

function DetailRow({ icon, label, value, colors }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
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
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Main Card
  mainCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Items Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  itemCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemCategoryEmoji: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  itemCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty Items
  emptyItems: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
