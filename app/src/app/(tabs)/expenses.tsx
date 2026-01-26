// src/app/(tabs)/expenses.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/Input';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { useExpenses, useUpdateExpense } from '../../hooks/useExpenses';
import { useCategories } from '../../hooks/useCategories';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToExcel, exportToPDF } from '../../utils/exportData';
import { Expense } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getTheme, radius, getShadow, colors } from '../../constants/theme';

type FilterMode = 'month' | 'range';

const CATEGORY_ICONS: Record<string, string> = {
  cart: '🛒', utensils: '🍽️', car: '🚗', lightbulb: '💡', film: '🎬',
  'heart-pulse': '🏥', 'shopping-bag': '🛍️', home: '🏠', 'book-open': '📚',
  plane: '✈️', briefcase: '💼', laptop: '💻', gift: '🎁', 'trending-up': '📈',
  'plus-circle': '➕', package: '📦',
};

const getIconEmoji = (icon: string) => CATEGORY_ICONS[icon] || '📦';

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

export default function ExpensesScreen() {
  const { isDark } = useColorMode();
  const { isMobile, horizontalPadding, isDesktop } = useResponsive();
  const theme = getTheme(isDark);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: expenseData, isLoading, refetch } = useExpenses({ enabled: isAuthenticated });
  const expenses = expenseData?.items || [];
  const { data: categories } = useCategories({ filters: { type: 'expense' }, enabled: isAuthenticated });
  const updateExpense = useUpdateExpense();

  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { startDate, endDate } = useMemo(() => {
    if (filterMode === 'month') {
      const { start, end } = getMonthBounds(selectedMonth);
      return { startDate: start, endDate: end };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  }, [filterMode, selectedMonth, customStartDate, customEndDate]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    return expenses.filter((exp) => {
      const expDate = new Date(exp.expenseDate);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, startDate, endDate]);

  const totals = useMemo(() =>
    filteredExpenses.reduce(
      (acc, exp) => ({
        usd: acc.usd + (exp.amountUsd != null ? parseFloat(String(exp.amountUsd)) : 0),
        eur: acc.eur + (exp.amountEur != null ? parseFloat(String(exp.amountEur)) : 0),
        brl: acc.brl + (exp.amountBrl != null ? parseFloat(String(exp.amountBrl)) : 0),
        count: acc.count + 1,
      }),
      { usd: 0, eur: 0, brl: 0, count: 0 }
    ), [filteredExpenses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  }, [selectedMonth]);

  const handleCategorySelect = useCallback(async (categoryKey: string) => {
    if (!selectedExpense) return;
    try {
      await updateExpense.mutateAsync({ id: selectedExpense.id, data: { category: categoryKey } });
      setShowCategoryPicker(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }, [selectedExpense, updateExpense]);

  const getCategoryInfo = useCallback((categoryKey: string) => {
    const cat = categories?.find((c) => c.defaultCategoryKey === categoryKey || c.name.toLowerCase() === categoryKey);
    if (cat) return { label: cat.name, icon: getIconEmoji(cat.icon), color: cat.color };
    return { label: categoryKey, icon: '📦', color: '#6B7280' };
  }, [categories]);

  const getExportFilename = useCallback(() => {
    const dateStr = filterMode === 'month'
      ? selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(' ', '_')
      : `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    return `gastos_${dateStr}`;
  }, [filterMode, selectedMonth, startDate, endDate]);

  const handleExport = useCallback(async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const exportOptions = {
        expenses: filteredExpenses,
        filename: getExportFilename(),
        dateRange: { start: startDate, end: endDate },
        totals,
      };

      if (format === 'excel') {
        await exportToExcel(exportOptions);
      } else {
        await exportToPDF(exportOptions);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredExpenses, getExportFilename, startDate, endDate, totals]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
          <Text style={styles.authIcon}>💰</Text>
          <Text style={[styles.authTitle, { color: theme.text }]}>Inicia sesión para ver gastos</Text>
          <Text style={[styles.authSubtitle, { color: theme.textSecondary }]}>Controla tus gastos y administra tus finanzas</Text>
          <Link href="/auth" asChild><Button title="Iniciar Sesión" /></Link>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Filter Toggle + Export Button Row */}
      <View style={styles.filterRow}>
        <SegmentedControl
          options={[
            { key: 'month', label: 'Por Mes', icon: '📅' },
            { key: 'range', label: 'Rango', icon: '📊' },
          ]}
          selected={filterMode}
          onChange={(key) => key === 'range' ? setShowDatePicker(true) : setFilterMode(key as FilterMode)}
          style={{ flex: 1 }}
        />
        <Pressable
          onPress={() => setShowExportMenu(true)}
          disabled={isExporting || filteredExpenses.length === 0}
          style={[
            styles.exportButton,
            { backgroundColor: theme.primary, opacity: (isExporting || filteredExpenses.length === 0) ? 0.5 : 1 },
          ]}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.exportButtonText}>📤 Exportar</Text>
          )}
        </Pressable>
      </View>

      {/* Month Selector */}
      {filterMode === 'month' && (
        <View style={[styles.monthSelector, { backgroundColor: theme.surface, borderColor: theme.border }, getShadow('sm')]}>
          <Pressable onPress={goToPreviousMonth} style={[styles.monthArrow, { backgroundColor: theme.primaryLight }]}>
            <Text style={styles.arrowText}>←</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedMonth(new Date())} style={styles.monthLabel}>
            <Text style={[styles.monthText, { color: theme.text }]}>{formatMonthYear(selectedMonth)}</Text>
            {!isCurrentMonth && <Text style={[styles.todayLink, { color: theme.primary }]}>Toca para ir a hoy</Text>}
          </Pressable>
          <Pressable onPress={goToNextMonth} style={[styles.monthArrow, { backgroundColor: theme.primaryLight }]}>
            <Text style={styles.arrowText}>→</Text>
          </Pressable>
        </View>
      )}

      {/* Summary Card */}
      <Card variant="glass" style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Gastos Totales</Text>
        <View style={styles.totalsRow}>
          {[
            { label: 'USD', value: totals.usd, color: colors.success.main },
            { label: 'EUR', value: totals.eur, color: colors.primary[600] },
            { label: 'BRL', value: totals.brl, color: colors.warning.main },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.totalItem}>
              <View style={[styles.currencyBadge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.currencyBadgeText, { color }]}>{label}</Text>
              </View>
              <Text style={[styles.totalValue, { color: theme.text }]}>{formatCurrency(value, label as any)}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.transactionCount, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.transactionCountText, { color: theme.textSecondary }]}>{totals.count} transacciones</Text>
        </View>
      </Card>

      <Text style={[styles.listTitle, { color: theme.text }]}>Todas las Transacciones</Text>
    </View>
  );

  const handleExpensePress = useCallback((item: Expense) => {
    setSelectedExpense(item);
    setShowCategoryPicker(true);
  }, []);

  const renderExpenseCard = useCallback(({ item }: { item: Expense }) => {
    const catInfo = getCategoryInfo(item.category);
    return (
      <Pressable onPress={() => handleExpensePress(item)}>
        <Card variant="glass" style={styles.expenseCard}>
          <View style={styles.expenseRow}>
            <View style={[styles.expenseIcon, { backgroundColor: `${catInfo.color}20` }]}>
              <Text style={styles.expenseEmoji}>{catInfo.icon}</Text>
            </View>
            <View style={styles.expenseContent}>
              <Text style={[styles.expenseDesc, { color: theme.text }]} numberOfLines={1}>{item.description}</Text>
              <View style={styles.expenseMeta}>
                <View style={[styles.expenseCatBadge, { backgroundColor: `${catInfo.color}15` }]}>
                  <Text style={[styles.expenseCatText, { color: catInfo.color }]}>{catInfo.label}</Text>
                </View>
                <Text style={[styles.expenseDate, { color: theme.textMuted }]}>{formatDate(item.expenseDate)}</Text>
              </View>
            </View>
            <Text style={[styles.expenseAmount, { color: theme.primary }]}>
              {formatCurrency(item.amount, item.currency as any)}
            </Text>
          </View>
          <View style={[styles.convertedRow, { borderTopColor: theme.divider }]}>
            {item.amountUsd != null && item.currency !== 'USD' && <Text style={[styles.convertedText, { color: theme.textMuted }]}>{formatCurrency(item.amountUsd, 'USD')}</Text>}
            {item.amountEur != null && item.currency !== 'EUR' && <Text style={[styles.convertedText, { color: theme.textMuted }]}>{formatCurrency(item.amountEur, 'EUR')}</Text>}
            {item.amountBrl != null && item.currency !== 'BRL' && <Text style={[styles.convertedText, { color: theme.textMuted }]}>{formatCurrency(item.amountBrl, 'BRL')}</Text>}
          </View>
        </Card>
      </Pressable>
    );
  }, [getCategoryInfo, handleExpensePress, theme]);

  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
      <View style={styles.tableDescCol}>
        <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Descripción</Text>
      </View>
      <View style={styles.tableCatCol}>
        <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Categoría</Text>
      </View>
      <View style={styles.tableDateCol}>
        <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Fecha</Text>
      </View>
      <View style={styles.tableCurrencyCol}>
        <Text style={[styles.tableHeaderCell, styles.textRight, { color: theme.textSecondary }]}>USD</Text>
      </View>
      <View style={styles.tableCurrencyCol}>
        <Text style={[styles.tableHeaderCell, styles.textRight, { color: theme.textSecondary }]}>EUR</Text>
      </View>
      <View style={styles.tableCurrencyCol}>
        <Text style={[styles.tableHeaderCell, styles.textRight, { color: theme.textSecondary }]}>BRL</Text>
      </View>
    </View>
  );

  const renderTableRow = ({ item, index }: { item: Expense; index: number }) => {
    const catInfo = getCategoryInfo(item.category);
    const isEven = index % 2 === 0;
    return (
      <Pressable onPress={() => { setSelectedExpense(item); setShowCategoryPicker(true); }}>
        <View style={[
          styles.tableRow,
          { backgroundColor: isEven ? theme.surface : theme.background, borderColor: theme.border }
        ]}>
          <View style={styles.tableDescCol}>
            <Text style={[styles.tableText, { color: theme.text }]} numberOfLines={1}>{item.description}</Text>
          </View>
          <View style={styles.tableCatCol}>
            <View style={[styles.tableCatBadge, { backgroundColor: `${catInfo.color}15` }]}>
              <Text style={styles.tableCatIcon}>{catInfo.icon}</Text>
              <Text style={[styles.tableCatText, { color: catInfo.color }]} numberOfLines={1}>{catInfo.label}</Text>
            </View>
          </View>
          <View style={styles.tableDateCol}>
            <Text style={[styles.tableText, { color: theme.textSecondary }]}>{formatDate(item.expenseDate)}</Text>
          </View>
          <View style={styles.tableCurrencyCol}>
            <Text style={[styles.tableCurrencyText, styles.textRight, { color: item.currency === 'USD' ? theme.primary : theme.textMuted }]}>
              {item.amountUsd != null ? formatCurrency(item.amountUsd, 'USD') : '-'}
            </Text>
          </View>
          <View style={styles.tableCurrencyCol}>
            <Text style={[styles.tableCurrencyText, styles.textRight, { color: item.currency === 'EUR' ? theme.primary : theme.textMuted }]}>
              {item.amountEur != null ? formatCurrency(item.amountEur, 'EUR') : '-'}
            </Text>
          </View>
          <View style={styles.tableCurrencyCol}>
            <Text style={[styles.tableCurrencyText, styles.textRight, { color: item.currency === 'BRL' ? theme.primary : theme.textMuted }]}>
              {item.amountBrl != null ? formatCurrency(item.amountBrl, 'BRL') : '-'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderTable = () => (
    <Card variant="glass" style={styles.tableContainer}>
      {renderTableHeader()}
      {filteredExpenses.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin gastos aún</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Tus gastos aparecerán aquí</Text>
        </View>
      ) : (
        <FlashList
          data={filteredExpenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTableRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          estimatedItemSize={60}
          contentContainerStyle={styles.tableBody}
        />
      )}
    </Card>
  );

  // Use table on desktop, cards on mobile
  const useTableLayout = !isMobile;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      {useTableLayout ? (
        <ScrollView
          contentContainerStyle={{ padding: horizontalPadding, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {renderHeader()}
          {renderTable()}
        </ScrollView>
      ) : (
        <FlashList
          data={filteredExpenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpenseCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin gastos aún</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Tus gastos aparecerán aquí</Text>
            </View>
          ) : null}
          contentContainerStyle={{ padding: horizontalPadding, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          estimatedItemSize={100}
        />
      )}

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Cambiar Categoría</Text>
              {selectedExpense && <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>{selectedExpense.description}</Text>}
            </View>
            <ScrollView style={styles.categoryList}>
              {categories?.filter((c) => !c.isHidden).map((cat) => {
                const key = cat.defaultCategoryKey || cat.name.toLowerCase();
                const isSelected = selectedExpense?.category === key;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleCategorySelect(key)}
                    style={[styles.categoryOption, { borderBottomColor: theme.divider }, isSelected && { backgroundColor: theme.primaryLight }]}
                  >
                    <View style={[styles.categoryOptionIcon, { backgroundColor: `${cat.color}20` }]}>
                      <Text style={styles.categoryOptionEmoji}>{getIconEmoji(cat.icon)}</Text>
                    </View>
                    <Text style={[styles.categoryOptionText, { color: theme.text }, isSelected && { color: theme.primary, fontWeight: '600' }]}>{cat.name}</Text>
                    {isSelected && <Text style={{ color: theme.primary, fontSize: 18 }}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setShowCategoryPicker(false)} style={[styles.modalCancel, { borderTopColor: theme.divider }]}>
              <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <DateRangePicker visible={showDatePicker} startDate={customStartDate} endDate={customEndDate} onRangeChange={(s, e) => { setCustomStartDate(s); setCustomEndDate(e); setFilterMode('range'); }} onClose={() => setShowDatePicker(false)} />

      {/* Export Menu Modal */}
      <Modal visible={showExportMenu} transparent animationType="fade" onRequestClose={() => setShowExportMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowExportMenu(false)}>
          <View style={[styles.exportMenuContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.exportMenuTitle, { color: theme.text }]}>Exportar Gastos</Text>
            <Text style={[styles.exportMenuSubtitle, { color: theme.textSecondary }]}>
              {filteredExpenses.length} transacciones
            </Text>

            <View style={styles.exportOptions}>
              <Pressable
                onPress={() => handleExport('excel')}
                style={[styles.exportOption, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
              >
                <LinearGradient colors={['#10B981', '#059669']} style={styles.exportOptionIcon}>
                  <Text style={styles.exportOptionEmoji}>📊</Text>
                </LinearGradient>
                <View style={styles.exportOptionText}>
                  <Text style={[styles.exportOptionTitle, { color: theme.text }]}>Excel (.xlsx)</Text>
                  <Text style={[styles.exportOptionDesc, { color: theme.textSecondary }]}>Ideal para análisis y edición</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => handleExport('pdf')}
                style={[styles.exportOption, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
              >
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.exportOptionIcon}>
                  <Text style={styles.exportOptionEmoji}>📄</Text>
                </LinearGradient>
                <View style={styles.exportOptionText}>
                  <Text style={[styles.exportOptionTitle, { color: theme.text }]}>PDF</Text>
                  <Text style={[styles.exportOptionDesc, { color: theme.textSecondary }]}>Ideal para compartir e imprimir</Text>
                </View>
              </Pressable>
            </View>

            <Pressable onPress={() => setShowExportMenu(false)} style={styles.exportCancelButton}>
              <Text style={[styles.exportCancelText, { color: theme.textSecondary }]}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authIcon: { fontSize: 64, marginBottom: 16 },
  authTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  authSubtitle: { fontSize: 15, marginBottom: 24, textAlign: 'center' },
  headerContent: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  exportButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center' },
  exportButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: radius.xl, borderWidth: 1, marginBottom: 16 },
  monthArrow: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  arrowText: { fontSize: 18, fontWeight: '600' },
  monthLabel: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  monthText: { fontSize: 18, fontWeight: '700' },
  todayLink: { fontSize: 12, marginTop: 2 },
  summaryCard: { marginBottom: 20, alignItems: 'center' },
  summaryLabel: { fontSize: 14, marginBottom: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 12 },
  totalItem: { alignItems: 'center' },
  currencyBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  currencyBadgeText: { fontSize: 12, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  transactionCount: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md },
  transactionCountText: { fontSize: 14 },
  listTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  // Card styles (mobile)
  expenseCard: { padding: 16 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  expenseIcon: { width: 48, height: 48, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center' },
  expenseEmoji: { fontSize: 22 },
  expenseContent: { flex: 1 },
  expenseDesc: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expenseCatBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  expenseCatText: { fontSize: 11, fontWeight: '600' },
  expenseDate: { fontSize: 12 },
  expenseAmount: { fontSize: 16, fontWeight: '700' },
  convertedRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 16 },
  convertedText: { fontSize: 12 },
  // Table styles (desktop/tablet)
  tableContainer: { padding: 0, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableBody: { maxHeight: 500 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  tableText: { fontSize: 14 },
  textRight: { textAlign: 'right' },
  tableDescCol: { flex: 2.5, minWidth: 180, paddingRight: 12 },
  tableCatCol: { flex: 1.5, minWidth: 130, paddingRight: 12 },
  tableDateCol: { flex: 1, minWidth: 100, paddingRight: 12 },
  tableCurrencyCol: { width: 110, paddingLeft: 8 },
  tableCatBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6, alignSelf: 'flex-start' },
  tableCatIcon: { fontSize: 14 },
  tableCatText: { fontSize: 12, fontWeight: '600' },
  tableCurrencyText: { fontSize: 14, fontWeight: '600' },
  // Common
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '70%', borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], paddingBottom: 34 },
  modalHeader: { padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSubtitle: { fontSize: 14, marginTop: 4 },
  categoryList: { maxHeight: 400 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  categoryOptionIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  categoryOptionEmoji: { fontSize: 20 },
  categoryOptionText: { flex: 1, fontSize: 16 },
  modalCancel: { alignItems: 'center', padding: 16, borderTopWidth: 1 },
  modalCancelText: { fontSize: 16 },
  // Export menu styles
  exportMenuContent: { width: '90%', maxWidth: 400, borderRadius: radius['2xl'], padding: 24, alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' },
  exportMenuTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  exportMenuSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  exportOptions: { gap: 12 },
  exportOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.xl, borderWidth: 1, gap: 16 },
  exportOptionIcon: { width: 50, height: 50, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center' },
  exportOptionEmoji: { fontSize: 24 },
  exportOptionText: { flex: 1 },
  exportOptionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  exportOptionDesc: { fontSize: 13 },
  exportCancelButton: { marginTop: 16, padding: 12, alignItems: 'center' },
  exportCancelText: { fontSize: 16 },
});
