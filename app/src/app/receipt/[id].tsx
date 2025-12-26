import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { useReceipt } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { data: receipt, isLoading, error } = useReceipt(Number(id));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Failed to load receipt</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = receipt.category ? getCategoryInfo(receipt.category) : null;

  const getStatusColor = () => {
    switch (receipt.status) {
      case 'completed':
        return '#22c55e';
      case 'processing':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
      >
        {receipt.imageUrl && (
          <Card style={styles.imageCard} padding="none">
            <Image
              source={{ uri: receipt.imageUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </Card>
        )}

        <Card style={styles.mainCard}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.storeName}>
                {receipt.storeName || 'Unknown Store'}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
              >
                <Text style={styles.statusText}>{receipt.status}</Text>
              </View>
            </View>
            {receipt.totalAmount !== null && (
              <Text style={styles.totalAmount}>
                {formatCurrency(receipt.totalAmount, receipt.currency as any)}
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <DetailRow label="Date" value={receipt.purchaseDate ? formatDateTime(receipt.purchaseDate) : 'Unknown'} />
            <DetailRow label="Currency" value={receipt.currency} />
            {categoryInfo && (
              <DetailRow
                label="Category"
                value={`${categoryInfo.icon} ${categoryInfo.label}`}
              />
            )}
            <DetailRow label="Uploaded" value={formatDateTime(receipt.createdAt)} />
          </View>
        </Card>

        {receipt.items && receipt.items.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Items</Text>
            <Card>
              {receipt.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    index < receipt.items.length - 1 && styles.itemBorder,
                  ]}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {item.quantity} × {formatCurrency(item.unitPrice, receipt.currency as any)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.totalPrice, receipt.currency as any)}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
  },
  imageCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f9fafb',
  },
  mainCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
