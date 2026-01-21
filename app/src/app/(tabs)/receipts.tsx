// src/app/(tabs)/receipts.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ReceiptUploader } from '../../components/receipts/ReceiptUploader';
import { useReceipts } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { Receipt } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getTheme, radius, getShadow, colors, gradients } from '../../constants/theme';

export default function ReceiptsScreen() {
  const { isDark } = useColorMode();
  const router = useRouter();
  const { isDesktop, horizontalPadding } = useResponsive();
  const theme = getTheme(isDark);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: receipts, isLoading, refetch } = useReceipts({ enabled: isAuthenticated });
  const [refreshing, setRefreshing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const statusConfig = {
    completed: { color: colors.success.main, bg: 'rgba(16,185,129,0.15)', icon: '✓', label: 'Completado' },
    processing: { color: colors.warning.main, bg: 'rgba(245,158,11,0.15)', icon: '⏳', label: 'Procesando' },
    failed: { color: colors.danger.main, bg: 'rgba(239,68,68,0.15)', icon: '✕', label: 'Error' },
    pending: { color: colors.gray[500], bg: 'rgba(107,114,128,0.15)', icon: '•', label: 'Pendiente' },
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUploadSuccess = () => {
    Alert.alert('Éxito', '¡Recibo subido y procesando!');
    refetch();
  };

  const handleUploadError = (error: Error) => {
    Alert.alert('Error', error.message || 'Error al subir el recibo');
  };

  // Calculate stats
  const stats = receipts
    ? {
        total: receipts.length,
        completed: receipts.filter((r) => r.status === 'completed').length,
        pending: receipts.filter((r) => r.status === 'processing' || r.status === 'pending').length,
      }
    : { total: 0, completed: 0, pending: 0 };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
          <Text style={styles.authIcon}>🧾</Text>
          <Text style={[styles.authTitle, { color: theme.text }]}>
            Inicia sesión para escanear recibos
          </Text>
          <Text style={[styles.authSubtitle, { color: theme.textSecondary }]}>
            Sube recibos y deja que la IA extraiga los detalles
          </Text>
          <Link href="/auth" asChild>
            <Button title="Iniciar Sesión" />
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Upload Area */}
      <Pressable
        onPressIn={() => setDragActive(true)}
        onPressOut={() => setDragActive(false)}
        style={[
          styles.uploadArea,
          { backgroundColor: dragActive ? theme.primaryLight : theme.surface, borderColor: dragActive ? theme.primary : theme.border },
          getShadow('sm'),
        ]}
      >
        <LinearGradient
          colors={gradients.primary as [string, string, ...string[]]}
          style={[styles.uploadIcon, getShadow('primary')]}
        >
          <Text style={styles.uploadEmoji}>📷</Text>
        </LinearGradient>
        <Text style={[styles.uploadTitle, { color: theme.text }]}>Sube tu Recibo</Text>
        <Text style={[styles.uploadDesc, { color: theme.textSecondary }]}>
          Arrastra una imagen o toca para seleccionar.{'\n'}
          La IA extraerá todos los detalles automáticamente.
        </Text>
        <ReceiptUploader onSuccess={handleUploadSuccess} onError={handleUploadError} />
      </Pressable>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, icon: '📄', color: theme.primary },
          { label: 'Procesados', value: stats.completed, icon: '✓', color: colors.success.main },
          { label: 'Pendientes', value: stats.pending, icon: '⏳', color: colors.warning.main },
        ].map(({ label, value, icon, color }) => (
          <View
            key={label}
            style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }, getShadow('sm')]}
          >
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
              <Text style={styles.statEmoji}>{icon}</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Recibos Recientes</Text>
    </View>
  );

  const renderReceiptCard = ({ item }: { item: Receipt }) => {
    const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Pressable onPress={() => router.push(`/receipt/${item.id}`)}>
        <Card variant="glass" style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <View style={[styles.receiptIcon, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.receiptEmoji}>🧾</Text>
              {item.status === 'processing' && (
                <View style={[styles.receiptStatusDot, { backgroundColor: status.bg }]}>
                  <Text style={styles.receiptStatusDotText}>⏳</Text>
                </View>
              )}
            </View>
            <View style={styles.receiptContent}>
              <Text style={[styles.receiptStore, { color: theme.text }]} numberOfLines={1}>
                {item.storeName || 'Tienda Desconocida'}
              </Text>
              <View style={styles.receiptMeta}>
                <View style={[styles.receiptBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.receiptBadgeText, { color: status.color }]}>
                    {status.icon} {status.label}
                  </Text>
                </View>
                {item.expenses && item.expenses.length > 0 && (
                  <Text style={[styles.receiptItems, { color: theme.textMuted }]}>
                    {item.expenses.length} items
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.receiptRight}>
              {item.totalAmount !== null && (
                <Text style={[styles.receiptAmount, { color: theme.primary }]}>
                  €{item.totalAmount.toFixed(2)}
                </Text>
              )}
              <Text style={[styles.receiptDate, { color: theme.textMuted }]}>
                {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReceiptCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin recibos aún</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Sube tu primer recibo para comenzar
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          { paddingVertical: 8, paddingHorizontal: horizontalPadding },
          isDesktop && styles.desktopContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContent: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authIcon: { fontSize: 64, marginBottom: 16 },
  authTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  authSubtitle: { fontSize: 15, marginBottom: 24, textAlign: 'center' },
  headerContent: { marginBottom: 16 },
  // Upload Area
  uploadArea: {
    borderRadius: radius['3xl'],
    padding: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadEmoji: { fontSize: 36 },
  uploadTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  uploadDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  // Receipt Card
  receiptCard: { padding: 16 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  receiptIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  receiptEmoji: { fontSize: 26 },
  receiptStatusDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  receiptStatusDotText: { fontSize: 10 },
  receiptContent: { flex: 1 },
  receiptStore: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  receiptMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  receiptBadgeText: { fontSize: 11, fontWeight: '600' },
  receiptItems: { fontSize: 12 },
  receiptRight: { alignItems: 'flex-end' },
  receiptAmount: { fontSize: 18, fontWeight: '700' },
  receiptDate: { fontSize: 12, marginTop: 4 },
  chevron: { fontSize: 20 },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
