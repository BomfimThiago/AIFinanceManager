import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform } from 'react-native';
import { Receipt } from '../../types';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';
import { useColorMode } from '../../providers/GluestackUIProvider';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress: (receipt: Receipt) => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  const { isDark } = useColorMode();
  const categoryInfo = receipt.category ? getCategoryInfo(receipt.category) : null;

  const colors = {
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    imageBg: isDark ? '#374151' : '#f3f4f6',
    primary: '#7c3aed',
  };

  const getStatusConfig = () => {
    switch (receipt.status) {
      case 'completed':
        return { color: '#22c55e', bg: isDark ? '#22c55e20' : '#dcfce7', label: 'Completado' };
      case 'processing':
        return { color: '#f59e0b', bg: isDark ? '#f59e0b20' : '#fef3c7', label: 'Procesando' };
      case 'failed':
        return { color: '#ef4444', bg: isDark ? '#ef444420' : '#fee2e2', label: 'Error' };
      default:
        return { color: '#6b7280', bg: isDark ? '#6b728020' : '#f3f4f6', label: 'Pendiente' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Pressable
      onPress={() => onPress(receipt)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.cardPressed,
        Platform.OS === 'ios' && styles.shadowIOS,
        Platform.OS === 'android' && styles.shadowAndroid,
        Platform.OS === 'web' && styles.shadowWeb,
      ]}
    >
      <View style={styles.row}>
        {/* Image/Thumbnail */}
        <View style={[styles.imageContainer, { backgroundColor: colors.imageBg }]}>
          {receipt.imageUrl ? (
            <Image source={{ uri: receipt.imageUrl }} style={styles.image} />
          ) : (
            <Text style={styles.imagePlaceholderText}>🧾</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header row: Store name + Status */}
          <View style={styles.header}>
            <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>
              {receipt.storeName || 'Tienda Desconocida'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Amount */}
          {receipt.totalAmount !== null && (
            <Text style={[styles.amount, { color: colors.primary }]}>
              {formatCurrency(receipt.totalAmount, receipt.currency as any)}
            </Text>
          )}

          {/* Footer: Category + Date */}
          <View style={styles.footer}>
            {categoryInfo ? (
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
                <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                  {categoryInfo.label}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatRelativeTime(receipt.createdAt)}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  shadowAndroid: {
    elevation: 3,
  },
  shadowWeb: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 56,
    height: 56,
  },
  imagePlaceholderText: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 24,
    marginLeft: 8,
  },
});
