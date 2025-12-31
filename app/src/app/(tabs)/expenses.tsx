import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { useExpenses, useUpdateExpense } from '../../hooks/useExpenses';
import { useCategories } from '../../hooks/useCategories';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCategoryInfo } from '../../constants/categories';
import { Expense } from '../../types';
import { useAuthStore } from '../../store/authStore';

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
  const { isMobile } = useResponsive();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: expenses, isLoading, refetch } = useExpenses({ enabled: isAuthenticated });
  const { data: categories } = useCategories({
    filters: { type: 'expense' },
    enabled: isAuthenticated,
  });
  const updateExpense = useUpdateExpense();
  const [refreshing, setRefreshing] = useState(false);

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

  // Filter expenses by date range (compare dates only, ignore time)
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];

    // Normalize dates to start of day for comparison
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log('Filter mode:', filterMode);
    console.log('Start date:', start.toISOString());
    console.log('End date:', end.toISOString());
    console.log('Total expenses:', expenses.length);

    const filtered = expenses.filter((exp) => {
      const expDate = new Date(exp.expenseDate);
      const inRange = expDate >= start && expDate <= end;
      console.log('Expense date:', exp.expenseDate, 'parsed:', expDate.toISOString(), 'inRange:', inRange);
      return inRange;
    });

    console.log('Filtered count:', filtered.length);
    return filtered;
  }, [expenses, startDate, endDate, filterMode]);

  // Calculate totals per currency from filtered expenses
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

  // Navigate months
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
    console.log('handleCategorySelect called with:', categoryKey);
    console.log('selectedExpense:', selectedExpense);
    if (!selectedExpense) return;

    try {
      console.log('Updating expense', selectedExpense.id, 'to category:', categoryKey);
      await updateExpense.mutateAsync({
        id: selectedExpense.id,
        data: { category: categoryKey },
      });
      console.log('Update successful');
      setShowCategoryPicker(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // Early return for unauthenticated users (after all hooks)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>Inicia sesión para ver gastos</Text>
          <Text style={styles.authSubtitle}>
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

  // Helper to get category info from fetched categories or fallback to static
  const getExpenseCategoryInfo = (categoryKey: string) => {
    // First try to find in fetched categories
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
    // Fallback to static categories
    const staticInfo = getCategoryInfo(categoryKey);
    return {
      label: staticInfo.label,
      icon: staticInfo.icon,
      color: staticInfo.color,
    };
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const categoryInfo = getExpenseCategoryInfo(item.category);

    return (
      <Pressable onPress={() => handleOpenCategoryPicker(item)}>
        <Card style={styles.expenseCard}>
          <View style={styles.expenseRow}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: categoryInfo.color + '20' },
              ]}
            >
              <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
            </View>
            <View style={styles.expenseContent}>
              <Text style={styles.expenseDescription} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={styles.expenseCategory}>{categoryInfo.label}</Text>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>
                {formatCurrency(item.amount, item.currency as any)}
              </Text>
              <Text style={styles.expenseDate}>{formatDate(item.expenseDate)}</Text>
            </View>
          </View>
          {/* Converted amounts */}
          <View style={styles.convertedRow}>
            {item.amountUsd != null && item.currency !== 'USD' && (
              <Text style={styles.convertedAmount}>
                {formatCurrency(item.amountUsd, 'USD')}
              </Text>
            )}
            {item.amountEur != null && item.currency !== 'EUR' && (
              <Text style={styles.convertedAmount}>
                {formatCurrency(item.amountEur, 'EUR')}
              </Text>
            )}
            {item.amountBrl != null && item.currency !== 'BRL' && (
              <Text style={styles.convertedAmount}>
                {formatCurrency(item.amountBrl, 'BRL')}
              </Text>
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
        style={[styles.tableRow, isEven && styles.tableRowEven]}
        onPress={() => handleOpenCategoryPicker(item)}
      >
        <View style={styles.tableCell}>
          <Text style={styles.tableCellText}>{formatDate(item.expenseDate)}</Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellDescription]}>
          <Text style={styles.tableCellText} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <View style={styles.tableCell}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeIcon}>{categoryInfo.icon}</Text>
            <Text style={styles.categoryBadgeText}>{categoryInfo.label}</Text>
          </View>
        </View>
        <View style={styles.tableCell}>
          <Text style={styles.tableCellText}>{item.storeName || '-'}</Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellAmount]}>
          <Text style={[styles.amountText, item.currency === 'USD' && styles.amountHighlight]}>
            {item.amountUsd != null ? formatCurrency(item.amountUsd, 'USD') : '-'}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellAmount]}>
          <Text style={[styles.amountText, item.currency === 'EUR' && styles.amountHighlight]}>
            {item.amountEur != null ? formatCurrency(item.amountEur, 'EUR') : '-'}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.tableCellAmount]}>
          <Text style={[styles.amountText, item.currency === 'BRL' && styles.amountHighlight]}>
            {item.amountBrl != null ? formatCurrency(item.amountBrl, 'BRL') : '-'}
          </Text>
        </View>
      </Pressable>
    );
  };

  const isCurrentMonth =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear();

  const renderFilterModeToggle = () => (
    <View style={styles.filterModeToggle}>
      <Pressable
        style={[styles.filterModeButton, filterMode === 'month' && styles.filterModeButtonActive]}
        onPress={() => setFilterMode('month')}
      >
        <Text style={[styles.filterModeText, filterMode === 'month' && styles.filterModeTextActive]}>
          Mes
        </Text>
      </Pressable>
      <Pressable
        style={[styles.filterModeButton, filterMode === 'range' && styles.filterModeButtonActive]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.filterModeText, filterMode === 'range' && styles.filterModeTextActive]}>
          Rango
        </Text>
      </Pressable>
    </View>
  );

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <Pressable onPress={goToPreviousMonth} style={styles.monthArrow}>
        <Text style={styles.monthArrowText}>←</Text>
      </Pressable>
      <Pressable onPress={goToCurrentMonth} style={styles.monthLabel}>
        <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
        {!isCurrentMonth && (
          <Text style={styles.todayHint}>Toca para ir a hoy</Text>
        )}
      </Pressable>
      <Pressable onPress={goToNextMonth} style={styles.monthArrow}>
        <Text style={styles.monthArrowText}>→</Text>
      </Pressable>
    </View>
  );

  const renderRangeSelector = () => (
    <Pressable style={styles.rangeSelector} onPress={() => setShowDatePicker(true)}>
      <View style={styles.rangeDateBox}>
        <Text style={styles.rangeDateLabel}>Desde</Text>
        <Text style={styles.rangeDateValue}>{formatShortDate(customStartDate)}</Text>
      </View>
      <Text style={styles.rangeArrow}>→</Text>
      <View style={styles.rangeDateBox}>
        <Text style={styles.rangeDateLabel}>Hasta</Text>
        <Text style={styles.rangeDateValue}>{formatShortDate(customEndDate)}</Text>
      </View>
      <Text style={styles.rangeEditHint}>Toca para editar</Text>
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
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Gastos Totales</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalCurrency}>USD</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.usd, 'USD')}</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalCurrency}>EUR</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.eur, 'EUR')}</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalCurrency}>BRL</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.brl, 'BRL')}</Text>
          </View>
        </View>
        <Text style={styles.summarySubtext}>
          {totals.count} transacciones
        </Text>
      </Card>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💰</Text>
      <Text style={styles.emptyTitle}>Sin gastos aún</Text>
      <Text style={styles.emptyText}>
        Tus gastos aparecerán aquí cuando comiences a registrarlos
      </Text>
    </View>
  );

  const renderCategoryPicker = () => (
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowCategoryPicker(false)}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Categoría</Text>
            {selectedExpense && (
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {selectedExpense.description}
              </Text>
            )}
          </View>
          <ScrollView style={styles.categoryList}>
            {categories?.filter(cat => !cat.isHidden).map((cat) => {
              const categoryKey = cat.defaultCategoryKey || cat.name.toLowerCase();
              const isSelected = selectedExpense?.category === categoryKey;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    console.log('Category pressed:', categoryKey);
                    handleCategorySelect(categoryKey);
                  }}
                >
                  <View
                    style={[
                      styles.categoryOptionIcon,
                      { backgroundColor: cat.color + '20' },
                    ]}
                  >
                    <Text style={styles.categoryOptionEmoji}>{getIconEmoji(cat.icon)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.categoryOptionLabel,
                      isSelected && styles.categoryOptionLabelSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {isSelected && (
                    <Text style={styles.categoryCheckmark}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryPicker(false)}
          >
            <Text style={styles.modalCloseText}>Cancelar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  // Mobile: Card view
  if (isMobile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpenseCard}
          ListHeaderComponent={renderSummary}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        <DateRangePicker
          visible={showDatePicker}
          startDate={customStartDate}
          endDate={customEndDate}
          onRangeChange={handleRangeChange}
          onClose={() => setShowDatePicker(false)}
        />
        {renderCategoryPicker()}
      </SafeAreaView>
    );
  }

  // Desktop/Tablet: Table view
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.desktopContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSummary()}

        {filteredExpenses.length > 0 ? (
          <Card style={styles.tableCard} padding="none">
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Fecha</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellDescription]}>
                <Text style={styles.tableHeaderText}>Descripción</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Categoría</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Tienda</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellAmount]}>
                <Text style={styles.tableHeaderText}>USD</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellAmount]}>
                <Text style={styles.tableHeaderText}>EUR</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellAmount]}>
                <Text style={styles.tableHeaderText}>BRL</Text>
              </View>
            </View>

            {/* Table Body */}
            {filteredExpenses.map((expense, index) => renderTableRow(expense, index))}
          </Card>
        ) : (
          !isLoading && renderEmpty()
        )}
      </ScrollView>
      <DateRangePicker
        visible={showDatePicker}
        startDate={customStartDate}
        endDate={customEndDate}
        onRangeChange={handleRangeChange}
        onClose={() => setShowDatePicker(false)}
      />
      {renderCategoryPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    padding: 16,
  },
  desktopContent: {
    padding: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  // Filter mode toggle
  filterModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  filterModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterModeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterModeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterModeTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  // Month selector styles
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthArrow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthArrowText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  todayHint: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 2,
  },
  // Range selector styles
  rangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rangeDateBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rangeDateLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  rangeDateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rangeArrow: {
    fontSize: 16,
    color: '#9ca3af',
    marginHorizontal: 8,
  },
  rangeEditHint: {
    fontSize: 11,
    color: '#3b82f6',
    marginLeft: 12,
  },
  summaryCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 8,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalCurrency: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  // Card styles (mobile)
  expenseCard: {
    marginBottom: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseContent: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  convertedRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  convertedAmount: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Table styles (desktop)
  tableCard: {
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  tableCellDescription: {
    flex: 2,
  },
  tableCellAmount: {
    alignItems: 'flex-end',
  },
  tableCellText: {
    fontSize: 14,
    color: '#374151',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  amountHighlight: {
    fontWeight: '700',
    color: '#1f2937',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#4b5563',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
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
  // Auth prompt
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
  // Category picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryOptionEmoji: {
    fontSize: 18,
  },
  categoryOptionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  categoryOptionLabelSelected: {
    fontWeight: '600',
    color: '#2563eb',
  },
  categoryCheckmark: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalCloseButton: {
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
