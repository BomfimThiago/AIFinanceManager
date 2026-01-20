import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Pressable,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { ReceiptUploader } from '../../components/receipts/ReceiptUploader';
import { Button } from '../../components/ui/Button';
import { useReceipts } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { Receipt } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getThemeColors, getStatusConfig, GRADIENTS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ReceiptsScreen() {
  const { isDark } = useColorMode();
  const router = useRouter();
  const { isDesktop, isSmallMobile, horizontalPadding, isMobile } = useResponsive();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: receipts, isLoading, refetch } = useReceipts({ enabled: isAuthenticated });
  const [refreshing, setRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const colors = getThemeColors(isDark);

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
            <View style={[styles.authIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.authIcon}>🧾</Text>
            </View>
            <Text style={[styles.authTitle, { color: colors.text, fontSize: isSmallMobile ? 22 : 26 }]}>
              Escanea tus Recibos
            </Text>
            <Text style={[styles.authSubtitle, { color: colors.textSecondary, fontSize: isSmallMobile ? 14 : 16 }]}>
              Sube recibos y deja que la IA extraiga todos los detalles automaticamente
            </Text>
            <Link href="/auth" asChild>
              <Pressable style={styles.authButtonWrapper}>
                <LinearGradient
                  colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
                  style={styles.authButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.authButtonText}>Iniciar Sesion</Text>
                </LinearGradient>
              </Pressable>
            </Link>
          </View>
        </SafeAreaView>
      </LinearGradient>
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
    Alert.alert('Exito', 'Recibo subido y procesando!');
    refetch();
  };

  const handleUploadError = (error: Error) => {
    Alert.alert('Error', error.message || 'Error al subir el recibo');
  };

  const renderReceiptCard = ({ item }: { item: Receipt }) => {
    const statusConfig = getStatusConfig(item.status, isDark);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.receiptCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && styles.receiptCardPressed,
          Platform.OS === 'ios' && styles.shadowIOS,
          Platform.OS === 'android' && styles.shadowAndroid,
          Platform.OS === 'web' && styles.shadowWeb,
        ]}
        onPress={() => handleReceiptPress(item)}
      >
        {/* Left Icon */}
        <View style={[styles.receiptIconContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.receiptIcon}>🧾</Text>
        </View>

        {/* Content */}
        <View style={styles.receiptContent}>
          <Text style={[styles.receiptStoreName, { color: colors.text }]} numberOfLines={1}>
            {item.storeName || 'Tienda Desconocida'}
          </Text>
          <View style={styles.receiptMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusIcon, { color: statusConfig.color }]}>{statusConfig.icon}</Text>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            {item.purchaseDate && (
              <Text style={[styles.receiptDate, { color: colors.textMuted }]}>
                {formatDate(item.purchaseDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Amount & Chevron */}
        <View style={styles.receiptRight}>
          {item.totalAmount !== null && (
            <Text style={[styles.receiptAmount, { color: colors.primary }]}>
              {formatCurrency(item.totalAmount, item.currency as any)}
            </Text>
          )}
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{receipts?.length || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {receipts?.filter((r) => r.status === 'completed').length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Procesados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {receipts?.filter((r) => r.status === 'processing').length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
        </View>
      </View>

      {/* Uploader */}
      {showUploader && (
        <ReceiptUploader onSuccess={handleUploadSuccess} onError={handleUploadError} />
      )}

      {/* Section Title */}
      {receipts && receipts.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          TODOS LOS RECIBOS
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={[
      styles.emptyContainer,
      { backgroundColor: colors.surface, borderColor: colors.border },
      Platform.OS === 'ios' && styles.shadowIOS,
    ]}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin recibos aun</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Sube tu primer recibo para comenzar a rastrear tus gastos
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReceiptCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: horizontalPadding },
            isDesktop && styles.desktopContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  desktopContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  // Auth Prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authIcon: {
    fontSize: 48,
  },
  authTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  authSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  authButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 280,
  },
  authButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Header Section
  headerSection: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 12,
  },
  // Receipt Card
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  receiptCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  receiptIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  receiptIcon: {
    fontSize: 24,
  },
  receiptContent: {
    flex: 1,
  },
  receiptStoreName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  receiptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  statusIcon: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  receiptDate: {
    fontSize: 12,
  },
  receiptRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 20,
  },
  // Shadows
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  shadowAndroid: {
    elevation: 2,
  },
  shadowWeb: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
