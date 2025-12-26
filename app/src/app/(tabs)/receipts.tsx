import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { ReceiptUploader } from '../../components/receipts/ReceiptUploader';
import { ReceiptCard } from '../../components/receipts/ReceiptCard';
import { Button } from '../../components/ui/Button';
import { useReceipts } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { Receipt } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function ReceiptsScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: receipts, isLoading, refetch } = useReceipts({ enabled: isAuthenticated });
  const [refreshing, setRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>Sign in to scan receipts</Text>
          <Text style={styles.authSubtitle}>
            Upload receipts and let AI extract expense details
          </Text>
          <Link href="/auth" asChild>
            <Button title="Sign In" />
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleReceiptPress = (receipt: Receipt) => {
    router.push(`/receipt/${receipt.id}`);
  };

  const handleUploadSuccess = () => {
    Alert.alert('Success', 'Receipt uploaded and processing!');
    refetch();
  };

  const handleUploadError = (error: Error) => {
    Alert.alert('Error', error.message || 'Failed to upload receipt');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ReceiptCard receipt={item} onPress={handleReceiptPress} />
        )}
        ListHeaderComponent={
          showUploader ? (
            <ReceiptUploader
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>No receipts yet</Text>
              <Text style={styles.emptyText}>
                Upload your first receipt to get started
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    paddingVertical: 8,
  },
  desktopContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
});
