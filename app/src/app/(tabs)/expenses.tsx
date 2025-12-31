import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Card, Button, Text, AmountDisplay, CategoryBadge } from '../../components/ui';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { useExpenses, useUpdateExpense } from '../../hooks/useExpenses';
import { useCategories } from '../../hooks/useCategories';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';
import { Expense } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';

type FilterMode = 'month' | 'range';

// Helper function to convert icon name to emoji
function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    'cart': '🛒',
    'utensils': '🍽️',
    'car': '🚗',
    'lightbulb': '💡',
    'film': '🎬',
    'heart-pulse': '🏥',
    'shopping-bag': '🛍️',
    'home': '🏠',
    'book-open': '📚',
    'plane': '✈️',
    'key': '🔑',
    'zap': '⚡',
    'wifi': '📶',
    'shield': '🛡️',
    'repeat': '🔄',
    'briefcase': '💼',
    'laptop': '💻',
    'gift': '🎁',
    'trending-up': '📈',
    'plus-circle': '➕',
    'package': '📦',
    'arrow-down-circle': '⬇️',
    'rotate-ccw': '↩️',
  };
  return iconMap[iconName] || '📦';
}

// Helper functions for date handling
const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

export default function ExpensesScreen() {
  const { isDark } = useColorMode();
  const { isMobile, isSmallMobile, horizontalPadding, isDesktop } = useResponsive();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: expenses, isLoading, refetch } = useExpenses({ enabled: isAuthenticated });
  const { data: categories } = useCategories({
    filters: { type: 'expense' },
    enabled: isAuthenticated,
  });
  const updateExpense = useUpdateExpense();
  const [refreshing, setRefreshing] = useState(false);

  // Define colors based on dark mode
  const colors = {
    background: isDark ? '#111827' : '#ffffff',
    backgroundSecondary: isDark ? '#1f2937' : '#f9fafb',
    surface: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
    primaryLight: isDark ? '#7c3aed30' : '#ede9fe',
  };

  const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };

  // Shadow helper
  const getShadow = (size: string) => {
    if (Platform.OS === 'web') {
      return { boxShadow: size === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)' };
    }
    return Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: size === 'sm' ? 1 : 2 }, shadowOpacity: 0.1, shadowRadius: size === 'sm' ? 2 : 4 }
      : { elevation: size === 'sm' ? 2 : 4 };
  };

  // Category picker state
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Date filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get current date range based on filter mode
  const { startDate, endDate } = useMemo(() => {
    if (filterMode === 'month') {
      const { start, end } = getMonthBounds(selectedMonth);
      return { startDate: start, endDate: end };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  }, [filterMode, selectedMonth, customStartDate, customEndDate]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return expenses.filter((exp) => {
      const expDate = new Date(exp.expenseDate);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, startDate, endDate]);

  // Calculate totals per currency
  const totals = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, exp) => ({
        usd: acc.usd + (exp.amountUsd != null ? parseFloat(String(exp.amountUsd)) : 0),
        eur: acc.eur + (exp.amountEur != null ? parseFloat(String(exp.amountEur)) : 0),
        brl: acc.brl + (exp.amountBrl != null ? parseFloat(String(exp.amountBrl)) : 0),
        count: acc.count + 1,
      }),
      { usd: 0, eur: 0, brl: 0, count: 0 }
    );
  }, [filteredExpenses]);

  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const handleRangeChange = (start: Date, end: Date) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setFilterMode('range');
  };

  const handleOpenCategoryPicker = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowCategoryPicker(true);
  };

  const handleCategorySelect = async (categoryKey: string) => {
    if (!selectedExpense) return;
    try {
      await updateExpense.mutateAsync({
        id: selectedExpense.id,
        data: { category: categoryKey },
      });
      setShowCategoryPicker(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.authPrompt, { paddingHorizontal: horizontalPadding }]}>
          <Text variant={isSmallMobile ? 'displaySm' : 'displayMd'} style={{ textAlign: 'center', marginBottom: 12 }}>
            Inicia sesión para ver gastos
          </Text>
          <Text variant={isSmallMobile ? 'bodyMd' : 'bodyLg'} color="secondary" style={{ textAlign: 'center', marginBottom: isSmallMobile ? 24 : 32 }}>
            Controla tus gastos y administra tus finanzas
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

  const getExpenseCategoryInfo = (categoryKey: string) => {
    const fetchedCat = categories?.find(
      (cat) => cat.defaultCategoryKey === categoryKey || cat.name.toLowerCase() === categoryKey
    );
    if (fetchedCat) {
      return {
        label: fetchedCat.name,
        icon: getIconEmoji(fetchedCat.icon),
        color: fetchedCat.color,
      };
    }
    const staticInfo = getCategoryInfo(categoryKey);
    return { label: staticInfo.label, icon: staticInfo.icon, color: staticInfo.color };
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const categoryInfo = getExpenseCategoryInfo(item.category);
    return (
      <Pressable onPress={() => handleOpenCategoryPicker(item)}>
        <Card style={{ marginBottom: 8 }}>
          <View style={styles.expenseRow}>
            <View
              style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20', borderRadius: borderRadius.md }]}
            >
              <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
            </View>
            <View style={styles.expenseContent}>
              <Text variant="headingMd" numberOfLines={1}>{item.description}</Text>
              <Text variant="bodySm" color="secondary">{categoryInfo.label}</Text>
            </View>
            <View style={styles.expenseRight}>
              <AmountDisplay amount={item.amount} currency={item.currency} type="expense" size="small" />
              <Text variant="bodySm" color="muted" style={{ marginTop: 4 }}>{formatDate(item.expenseDate)}</Text>
            </View>
          </View>
          <View style={[styles.convertedRow, { borderTopColor: colors.border }]}>
            {item.amountUsd != null && item.currency !== 'USD' && (
              <Text variant="bodySm" color="secondary">{formatCurrency(item.amountUsd, 'USD')}</Text>
            )}
            {item.amountEur != null && item.currency !== 'EUR' && (
              <Text variant="bodySm" color="secondary">{formatCurrency(item.amountEur, 'EUR')}</Text>
            )}
            {item.amountBrl != null && item.currency !== 'BRL' && (
              <Text variant="bodySm" color="secondary">{formatCurrency(item.amountBrl, 'BRL')}</Text>
            )}
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderTableRow = (item: Expense, index: number) => {
    const categoryInfo = getExpenseCategoryInfo(item.category);
    const isEven = index % 2 === 0;
    return (
      <Pressable
        key={item.id}
        style={[styles.tableRow, { borderBottomColor: colors.border }, isEven && { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => handleOpenCategoryPicker(item)}
      >
        <View style={styles.tableCell}><Text variant="bodyMd">{formatDate(item.expenseDate)}</Text></View>
        <View style={[styles.tableCell, styles.tableCellDescription]}><Text variant="bodyMd" numberOfLines={1}>{item.description}</Text></View>
        <View style={styles.tableCell}><CategoryBadge category={item.category} size="small" /></View>
        <View style={styles.tableCell}><Text variant="bodyMd">{item.storeName || '-'}</Text></View>
        <View style={[styles.tableCell, styles.tableCellAmount]}>
          <Text variant="bodyMd" style={{ fontWeight: item.currency === 'USD' ? '700' : '500' }} color={item.currency === 'USD' ? 'primary' : 'secondary'}>
            {item.amountUsd != null ? formatCurrency(item.amountUsd, 'USD') : '-'}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellAmount]}>
          <Text variant="bodyMd" style={{ fontWeight: item.currency === 'EUR' ? '700' : '500' }} color={item.currency === 'EUR' ? 'primary' : 'secondary'}>
            {item.amountEur != null ? formatCurrency(item.amountEur, 'EUR') : '-'}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellAmount]}>
          <Text variant="bodyMd" style={{ fontWeight: item.currency === 'BRL' ? '700' : '500' }} color={item.currency === 'BRL' ? 'primary' : 'secondary'}>
            {item.amountBrl != null ? formatCurrency(item.amountBrl, 'BRL') : '-'}
          </Text>
        </View>
      </Pressable>
    );
  };

  const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear();

  const renderFilterModeToggle = () => (
    <View style={[styles.filterModeToggle, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md }]}>
      <Pressable
        style={[styles.filterModeButton, { borderRadius: borderRadius.sm }, filterMode === 'month' && { backgroundColor: colors.surface, ...getShadow('sm') }]}
        onPress={() => setFilterMode('month')}
      >
        <Text variant="bodyMd" color={filterMode === 'month' ? 'primary' : 'secondary'} style={{ fontWeight: filterMode === 'month' ? '600' : '500' }}>Mes</Text>
      </Pressable>
      <Pressable
        style={[styles.filterModeButton, { borderRadius: borderRadius.sm }, filterMode === 'range' && { backgroundColor: colors.surface, ...getShadow('sm') }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text variant="bodyMd" color={filterMode === 'range' ? 'primary' : 'secondary'} style={{ fontWeight: filterMode === 'range' ? '600' : '500' }}>Rango</Text>
      </Pressable>
    </View>
  );

  const renderMonthSelector = () => (
    <View style={[styles.monthSelector, { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...getShadow('sm') }]}>
      <Pressable onPress={goToPreviousMonth} style={[styles.monthArrow, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md }]}>
        <Text variant="headingMd">←</Text>
      </Pressable>
      <Pressable onPress={goToCurrentMonth} style={styles.monthLabel}>
        <Text variant="headingLg">{formatMonthYear(selectedMonth)}</Text>
        {!isCurrentMonth && <Text variant="bodySm" style={{ color: colors.primary, marginTop: 2 }}>Toca para ir a hoy</Text>}
      </Pressable>
      <Pressable onPress={goToNextMonth} style={[styles.monthArrow, { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md }]}>
        <Text variant="headingMd">→</Text>
      </Pressable>
    </View>
  );

  const renderRangeSelector = () => (
    <Pressable style={[styles.rangeSelector, { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...getShadow('sm') }]} onPress={() => setShowDatePicker(true)}>
      <View style={styles.rangeDateBox}>
        <Text variant="bodySm" color="muted">Desde</Text>
        <Text variant="headingMd">{formatShortDate(customStartDate)}</Text>
      </View>
      <Text variant="bodyLg" color="muted" style={{ marginHorizontal: 8 }}>→</Text>
      <View style={styles.rangeDateBox}>
        <Text variant="bodySm" color="muted">Hasta</Text>
        <Text variant="headingMd">{formatShortDate(customEndDate)}</Text>
      </View>
      <Text variant="bodySm" style={{ color: colors.primary, marginLeft: 12 }}>Toca para editar</Text>
    </Pressable>
  );

  const renderDateFilter = () => (
    <View>
      {renderFilterModeToggle()}
      {filterMode === 'month' ? renderMonthSelector() : renderRangeSelector()}
    </View>
  );

  const renderSummary = () => (
    <View>
      {renderDateFilter()}
      <Card style={{ marginBottom: 16, marginTop: 16, alignItems: 'center' }}>
        <Text variant="bodyMd" color="secondary" style={{ marginBottom: 12 }}>Gastos Totales</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalItem}><Text variant="bodySm" color="muted">USD</Text><AmountDisplay amount={totals.usd} currency="USD" type="expense" size="medium" /></View>
          <View style={styles.totalItem}><Text variant="bodySm" color="muted">EUR</Text><AmountDisplay amount={totals.eur} currency="EUR" type="expense" size="medium" /></View>
          <View style={styles.totalItem}><Text variant="bodySm" color="muted">BRL</Text><AmountDisplay amount={totals.brl} currency="BRL" type="expense" size="medium" /></View>
        </View>
        <Text variant="bodySm" color="muted" style={{ marginTop: 8 }}>{totals.count} transacciones</Text>
      </Card>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💰</Text>
      <Text variant="displaySm" style={{ marginBottom: 8 }}>Sin gastos aún</Text>
      <Text variant="bodyMd" color="secondary" style={{ textAlign: 'center' }}>Tus gastos aparecerán aquí cuando comiences a registrarlos</Text>
    </View>
  );

  const renderCategoryPicker = () => (
    <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryPicker(false)}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]} onStartShouldSetResponder={() => true}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text variant="headingLg">Cambiar Categoría</Text>
            {selectedExpense && <Text variant="bodyMd" color="secondary" numberOfLines={1} style={{ marginTop: 4 }}>{selectedExpense.description}</Text>}
          </View>
          <ScrollView style={styles.categoryList}>
            {categories?.filter(cat => !cat.isHidden).map((cat) => {
              const categoryKey = cat.defaultCategoryKey || cat.name.toLowerCase();
              const isSelected = selectedExpense?.category === categoryKey;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryOption, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.primaryLight }]}
                  onPress={() => handleCategorySelect(categoryKey)}
                >
                  <View style={[styles.categoryOptionIcon, { backgroundColor: cat.color + '20', borderRadius: borderRadius.md }]}>
                    <Text style={styles.categoryOptionEmoji}>{getIconEmoji(cat.icon)}</Text>
                  </View>
                  <Text variant="bodyLg" style={[{ flex: 1 }, isSelected && { fontWeight: '600', color: colors.primary }]}>{cat.name}</Text>
                  {isSelected && <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '600' }}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={[styles.modalCloseButton, { borderTopColor: colors.border }]} onPress={() => setShowCategoryPicker(false)}>
            <Text variant="bodyLg" color="secondary">Cancelar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  // Mobile: Card view
  if (isMobile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpenseCard}
          ListHeaderComponent={renderSummary}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={{ padding: horizontalPadding }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
        <DateRangePicker visible={showDatePicker} startDate={customStartDate} endDate={customEndDate} onRangeChange={handleRangeChange} onClose={() => setShowDatePicker(false)} />
        {renderCategoryPicker()}
      </SafeAreaView>
    );
  }

  // Desktop/Tablet: Table view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={[styles.desktopContent, { padding: 24 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {renderSummary()}
        {filteredExpenses.length > 0 ? (
          <Card style={styles.tableCard} padding="none">
            <View style={[styles.tableHeader, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
              <View style={styles.tableHeaderCell}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>Fecha</Text></View>
              <View style={[styles.tableHeaderCell, styles.tableCellDescription]}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>Descripción</Text></View>
              <View style={styles.tableHeaderCell}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>Categoría</Text></View>
              <View style={styles.tableHeaderCell}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>Tienda</Text></View>
              <View style={[styles.tableHeaderCell, styles.tableCellAmount]}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>USD</Text></View>
              <View style={[styles.tableHeaderCell, styles.tableCellAmount]}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>EUR</Text></View>
              <View style={[styles.tableHeaderCell, styles.tableCellAmount]}><Text variant="bodySm" color="secondary" style={{ textTransform: 'uppercase', fontWeight: '600' }}>BRL</Text></View>
            </View>
            {filteredExpenses.map((expense, index) => renderTableRow(expense, index))}
          </Card>
        ) : !isLoading && renderEmpty()}
      </ScrollView>
      <DateRangePicker visible={showDatePicker} startDate={customStartDate} endDate={customEndDate} onRangeChange={handleRangeChange} onClose={() => setShowDatePicker(false)} />
      {renderCategoryPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContent: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  filterModeToggle: { flexDirection: 'row', padding: 4, marginBottom: 12 },
  filterModeButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: 12 },
  monthArrow: { padding: 8 },
  monthLabel: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  rangeSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 16 },
  rangeDateBox: { alignItems: 'center', paddingHorizontal: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 8 },
  totalItem: { alignItems: 'center' },
  expenseRow: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryEmoji: { fontSize: 20 },
  expenseContent: { flex: 1 },
  expenseRight: { alignItems: 'flex-end' },
  convertedRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTopWidth: 1, gap: 12 },
  tableCard: { overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 12, paddingHorizontal: 16 },
  tableHeaderCell: { flex: 1, paddingHorizontal: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, alignItems: 'center' },
  tableCell: { flex: 1, paddingHorizontal: 8 },
  tableCellDescription: { flex: 2 },
  tableCellAmount: { alignItems: 'flex-end' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '70%', paddingBottom: 34 },
  modalHeader: { padding: 20, borderBottomWidth: 1 },
  categoryList: { maxHeight: 400 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  categoryOptionIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryOptionEmoji: { fontSize: 18 },
  modalCloseButton: { alignItems: 'center', padding: 16, borderTopWidth: 1 },
});
