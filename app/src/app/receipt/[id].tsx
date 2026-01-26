import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReceipt } from '../../hooks/useReceipts';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getThemeColors, getStatusConfig, GRADIENTS } from '../../constants/theme';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDesktop, horizontalPadding } = useResponsive();
  const { isDark } = useColorMode();
  const { data: receipt, isLoading, error } = useReceipt(Number(id));

  const colors = getThemeColors(isDark);

  if (isLoading) {
    return (
      <LinearGradient
        colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingIcon, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando recibo...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !receipt) {
    return (
      <LinearGradient
        colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Error</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              No se pudo cargar el recibo
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButtonWrapper}
            >
              <LinearGradient
                colors={GRADIENTS.primary as [string, string]}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Volver</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const statusConfig = getStatusConfig(receipt.status, isDark);

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding },
            isDesktop && styles.desktopContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Store Header with Gradient */}
          <LinearGradient
            colors={GRADIENTS.primary as [string, string, ...string[]]}
            style={styles.headerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative circles */}
            <View style={styles.headerCircle1} />
            <View style={styles.headerCircle2} />

            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.storeIconContainer}>
                  <Text style={styles.storeIcon}>🏪</Text>
                </View>
                <View>
                  <Text style={styles.storeName}>
                    {receipt.storeName || 'Tienda Desconocida'}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                    <Text style={styles.statusText}>{statusConfig.label}</Text>
                  </View>
                </View>
              </View>

              {receipt.totalAmount !== null && (
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(receipt.totalAmount, receipt.currency as any)}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Details Card */}
          <View style={[
            styles.detailsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            Platform.OS === 'ios' && styles.shadowIOS,
            Platform.OS === 'android' && styles.shadowAndroid,
            Platform.OS === 'web' && styles.shadowWeb,
          ]}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>Detalles</Text>

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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Articulos</Text>
                <View style={[styles.itemCountBadge, { backgroundColor: colors.primaryLight }]}>
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
                  const categoryInfo = getCategoryInfo(expense.category);
                  return (
                    <View
                      key={expense.id}
                      style={[
                        styles.itemRow,
                        index < receipt.expenses.length - 1 && [
                          styles.itemBorder,
                          { borderBottomColor: colors.border },
                        ],
                      ]}
                    >
                      <View style={[styles.itemIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                        <Text style={styles.itemEmoji}>{categoryInfo.icon}</Text>
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                          {expense.description}
                        </Text>
                        <Text style={[styles.itemCategory, { color: categoryInfo.color }]}>
                          {categoryInfo.label}
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
            <View style={[
              styles.emptyItems,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Platform.OS === 'ios' && styles.shadowIOS,
              Platform.OS === 'android' && styles.shadowAndroid,
              Platform.OS === 'web' && styles.shadowWeb,
            ]}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin articulos</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No se encontraron articulos en este recibo
              </Text>
            </View>
          )}

          {/* Processing state */}
          {receipt.status === 'processing' && (
            <View style={[
              styles.processingCard,
              { backgroundColor: colors.warningLight, borderColor: colors.warning + '40' },
            ]}>
              <Text style={styles.processingIcon}>⏳</Text>
              <Text style={[styles.processingTitle, { color: colors.warning }]}>
                Procesando recibo...
              </Text>
              <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                Estamos extrayendo la informacion del recibo. Esto puede tomar unos segundos.
              </Text>
            </View>
          )}

          {/* Failed state */}
          {receipt.status === 'failed' && (
            <View style={[
              styles.failedCard,
              { backgroundColor: colors.errorLight, borderColor: colors.error + '40' },
            ]}>
              <Text style={styles.failedIcon}>⚠️</Text>
              <Text style={[styles.failedTitle, { color: colors.error }]}>
                Error al procesar
              </Text>
              <Text style={[styles.failedText, { color: colors.textSecondary }]}>
                No pudimos extraer la informacion del recibo. Intenta subir una imagen mas clara.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof getThemeColors>;
}

function DetailRow({ icon, label, value, colors }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIconContainer, { backgroundColor: colors.primaryLight }]}>
        <Text style={styles.detailIcon}>{icon}</Text>
      </View>
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  desktopContent: {
    maxWidth: 600,
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
    borderRadius: 24,
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
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Header Card
  headerCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeIcon: {
    fontSize: 28,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    maxWidth: 160,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    color: '#ffffff',
    fontSize: 11,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
  },
  totalAmount: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  // Details Card
  detailsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIcon: {
    fontSize: 20,
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
    fontWeight: '600',
  },
  // Items Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  itemCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemsCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Shadows
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  shadowAndroid: {
    elevation: 3,
  },
  shadowWeb: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  // Empty Items
  emptyItems: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Processing Card
  processingCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
  },
  processingIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Failed Card
  failedCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
  },
  failedIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  failedTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  failedText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
