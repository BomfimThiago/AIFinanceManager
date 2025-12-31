import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { ReceiptUploader } from '../../components/receipts/ReceiptUploader';
import { ReceiptCard } from '../../components/receipts/ReceiptCard';
import { Button, Text } from '../../components/ui';
import { useReceipts } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { Receipt } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';

export default function ReceiptsScreen() {
  const { isDark } = useColorMode();
  const router = useRouter();
  const { isDesktop, isSmallMobile, horizontalPadding } = useResponsive();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: receipts, isLoading, refetch } = useReceipts({ enabled: isAuthenticated });
  const [refreshing, setRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const colors = {
    background: isDark ? '#111827' : '#ffffff',
    primary: '#7c3aed',
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
          <Text variant={isSmallMobile ? 'displaySm' : 'displayMd'} style={{ textAlign: 'center', marginBottom: 12 }}>
            Inicia sesión para escanear recibos
          </Text>
          <Text variant={isSmallMobile ? 'bodyMd' : 'bodyLg'} color="secondary" style={{ textAlign: 'center', marginBottom: isSmallMobile ? 24 : 32 }}>
            Sube recibos y deja que la IA extraiga los detalles de gastos
          </Text>
          <Link href="/auth" asChild>
            <Button title="Iniciar Sesión" />
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
    Alert.alert('Éxito', '¡Recibo subido y procesando!');
    refetch();
  };

  const handleUploadError = (error: Error) => {
    Alert.alert('Error', error.message || 'Error al subir el recibo');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
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
            <View style={[styles.emptyContainer, { paddingHorizontal: horizontalPadding }]}>
              <Text style={[styles.emptyIcon, { fontSize: isSmallMobile ? 48 : 64 }]}>🧾</Text>
              <Text variant={isSmallMobile ? 'headingLg' : 'displaySm'} style={{ marginBottom: 8 }}>
                Sin recibos aún
              </Text>
              <Text variant={isSmallMobile ? 'bodySm' : 'bodyMd'} color="secondary" style={{ textAlign: 'center' }}>
                Sube tu primer recibo para comenzar
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          { paddingVertical: 8, paddingHorizontal: horizontalPadding - 16 },
          isDesktop && styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
