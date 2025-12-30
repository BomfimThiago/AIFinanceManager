import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Receipt } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress: (receipt: Receipt) => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
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
    <Pressable onPress={() => onPress(receipt)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            {receipt.imageUrl ? (
              <Image source={{ uri: receipt.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📄</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.storeName} numberOfLines={1}>
                {receipt.storeName || 'Tienda Desconocida'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{receipt.status}</Text>
              </View>
            </View>

            {receipt.totalAmount !== null && (
              <Text style={styles.amount}>
                {formatCurrency(receipt.totalAmount, receipt.currency as any)}
              </Text>
            )}

            <View style={styles.footer}>
              {categoryInfo && (
                <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
                  <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                  <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                    {categoryInfo.label}
                  </Text>
                </View>
              )}
              <Text style={styles.date}>{formatRelativeTime(receipt.createdAt)}</Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 24,
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
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
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
    borderRadius: 8,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
});
