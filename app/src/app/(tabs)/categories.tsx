import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useHideCategory,
  useUnhideCategory,
  useInitializeCategories,
} from '../../hooks/useCategories';
import { useResponsive } from '../../hooks/useResponsive';
import { Category, CategoryCreate, CategoryType } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useColorMode } from '../../providers/GluestackUIProvider';

// Predefined colors for category selection
const CATEGORY_COLORS = [
  '#22c55e', '#f97316', '#3b82f6', '#eab308', '#a855f7',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#06b6d4',
  '#8b5cf6', '#fbbf24', '#0ea5e9', '#64748b', '#f43f5e',
  '#10b981', '#6b7280',
];

// Predefined icons (using icon names that match the backend)
const CATEGORY_ICONS = [
  { name: 'cart', emoji: '🛒' },
  { name: 'utensils', emoji: '🍽️' },
  { name: 'car', emoji: '🚗' },
  { name: 'lightbulb', emoji: '💡' },
  { name: 'film', emoji: '🎬' },
  { name: 'heart-pulse', emoji: '🏥' },
  { name: 'shopping-bag', emoji: '🛍️' },
  { name: 'home', emoji: '🏠' },
  { name: 'book-open', emoji: '📚' },
  { name: 'plane', emoji: '✈️' },
  { name: 'key', emoji: '🔑' },
  { name: 'zap', emoji: '⚡' },
  { name: 'wifi', emoji: '📶' },
  { name: 'shield', emoji: '🛡️' },
  { name: 'repeat', emoji: '🔄' },
  { name: 'briefcase', emoji: '💼' },
  { name: 'laptop', emoji: '💻' },
  { name: 'gift', emoji: '🎁' },
  { name: 'trending-up', emoji: '📈' },
  { name: 'plus-circle', emoji: '➕' },
  { name: 'package', emoji: '📦' },
];

type TabType = 'expense' | 'income';

// Helper function to convert icon name to emoji
function getIconEmoji(iconName: string): string {
  const icon = CATEGORY_ICONS.find(i => i.name === iconName);
  return icon?.emoji || '📦';
}

export default function CategoriesScreen() {
  const { isMobile, isDesktop, isSmallMobile, horizontalPadding } = useResponsive();
  const { isDark } = useColorMode();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Theme colors
  const colors = {
    background: isDark ? '#111827' : '#f3f4f6',
    surface: isDark ? '#1f2937' : '#ffffff',
    surfaceSecondary: isDark ? '#374151' : '#f9fafb',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    textMuted: isDark ? '#6b7280' : '#9ca3af',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
    primaryLight: isDark ? '#7c3aed30' : '#ede9fe',
    danger: '#ef4444',
    dangerLight: isDark ? '#ef444430' : '#fee2e2',
    success: '#10b981',
  };

  const { data: categories, isLoading, refetch } = useCategories({
    filters: { includeHidden: true },
    enabled: isAuthenticated,
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const hideCategory = useHideCategory();
  const unhideCategory = useUnhideCategory();
  const initializeCategories = useInitializeCategories();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CategoryType>('expense');
  const [formIcon, setFormIcon] = useState('package');
  const [formColor, setFormColor] = useState('#6b7280');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredCategories = categories?.filter((c) => c.type === activeTab) || [];
  const expenseCount = categories?.filter((c) => c.type === 'expense').length || 0;
  const incomeCount = categories?.filter((c) => c.type === 'income').length || 0;
  const visibleCount = filteredCategories.filter(c => !c.isHidden).length;
  const hiddenCount = filteredCategories.filter(c => c.isHidden).length;

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(activeTab);
    setFormIcon('package');
    setFormColor('#7c3aed');
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('No se puede editar', 'Las categorías predeterminadas no se pueden editar. Puedes ocultarlas.');
      return;
    }
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormIcon(category.icon);
    setFormColor(category.color);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es obligatorio');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          data: { name: formName, icon: formIcon, color: formColor },
        });
      } else {
        const newCategory: CategoryCreate = {
          name: formName,
          type: formType,
          icon: formIcon,
          color: formColor,
        };
        await createCategory.mutateAsync(newCategory);
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      Alert.alert('No se puede eliminar', 'Las categorías predeterminadas no se pueden eliminar. Puedes ocultarlas.');
      return;
    }

    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de que quieres eliminar "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(category.id);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Error al eliminar la categoría');
            }
          },
        },
      ]
    );
  };

  const handleToggleVisibility = async (category: Category) => {
    try {
      if (category.isHidden) {
        await unhideCategory.mutateAsync(category.id);
      } else {
        await hideCategory.mutateAsync(category.id);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar la categoría');
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeCategories.mutateAsync();
      Alert.alert('Éxito', 'Categorías inicializadas exitosamente');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al inicializar las categorías');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Text style={[styles.authIcon]}>🏷️</Text>
          <Text style={[styles.authTitle, { color: colors.text }]}>Gestiona tus Categorías</Text>
          <Text style={[styles.authText, { color: colors.textSecondary }]}>
            Inicia sesión para crear y organizar categorías personalizadas
          </Text>
          <Button title="Iniciar Sesión" onPress={() => {}} />
        </View>
      </SafeAreaView>
    );
  }

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() => openEditModal(item)}
      style={({ pressed }) => [
        styles.categoryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: item.isHidden ? 0.6 : (pressed ? 0.9 : 1),
        },
        Platform.OS === 'ios' && styles.shadowIOS,
        Platform.OS === 'android' && styles.shadowAndroid,
        Platform.OS === 'web' && styles.shadowWeb,
      ]}
    >
      <View style={styles.categoryRow}>
        {/* Icon with color background */}
        <View style={[styles.iconContainer, { backgroundColor: item.color + '25' }]}>
          <Text style={styles.iconText}>{getIconEmoji(item.icon)}</Text>
        </View>

        {/* Category info */}
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.badges}>
            {item.isDefault && (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>Sistema</Text>
              </View>
            )}
            {item.isHidden && (
              <View style={[styles.badge, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>Oculta</Text>
              </View>
            )}
          </View>
        </View>

        {/* Color indicator */}
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => handleToggleVisibility(item)}
          >
            <Text style={styles.actionIcon}>{item.isHidden ? '👁️' : '🙈'}</Text>
          </Pressable>
          {!item.isDefault && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.dangerLight }]}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats Summary */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{visibleCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activas</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textMuted }]}>{hiddenCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ocultas</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{filteredCategories.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
      </View>

      {/* Add Button */}
      <Button
        title={`+ Nueva Categoría`}
        onPress={openCreateModal}
        fullWidth
      />

      {(!categories || categories.length === 0) && (
        <Button
          title="Inicializar Categorías por Defecto"
          variant="outline"
          onPress={handleInitialize}
          fullWidth
          style={{ marginTop: 8 }}
        />
      )}

      {/* Section Title */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {activeTab === 'expense' ? 'CATEGORÍAS DE GASTO' : 'CATEGORÍAS DE INGRESO'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      {/* Segmented Tabs */}
      <View style={[styles.tabsWrapper, { backgroundColor: colors.background, paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.tabsContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Pressable
            style={[
              styles.tab,
              { paddingVertical: isSmallMobile ? 8 : 10, paddingHorizontal: isSmallMobile ? 8 : 12 },
              activeTab === 'expense' && [styles.activeTab, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setActiveTab('expense')}
          >
            <Text style={[styles.tabIcon, { fontSize: isSmallMobile ? 14 : 16 }]}>💸</Text>
            <Text style={[
              styles.tabText,
              { color: activeTab === 'expense' ? colors.text : colors.textSecondary, fontSize: isSmallMobile ? 12 : 14 }
            ]}>
              {isSmallMobile ? `Gastos (${expenseCount})` : `Gastos (${expenseCount})`}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              { paddingVertical: isSmallMobile ? 8 : 10, paddingHorizontal: isSmallMobile ? 8 : 12 },
              activeTab === 'income' && [styles.activeTab, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setActiveTab('income')}
          >
            <Text style={[styles.tabIcon, { fontSize: isSmallMobile ? 14 : 16 }]}>💰</Text>
            <Text style={[
              styles.tabText,
              { color: activeTab === 'income' ? colors.text : colors.textSecondary, fontSize: isSmallMobile ? 12 : 14 }
            ]}>
              {isSmallMobile ? `Ingresos (${incomeCount})` : `Ingresos (${incomeCount})`}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPadding }, isDesktop && styles.desktopContent]}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin categorías</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Crea tu primera categoría de {activeTab === 'expense' ? 'gasto' : 'ingreso'}
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Preview */}
              <View style={styles.previewSection}>
                <View style={[styles.previewCard, { backgroundColor: colors.surfaceSecondary }]}>
                  <View style={[styles.previewIcon, { backgroundColor: formColor + '25' }]}>
                    <Text style={styles.previewIconText}>{getIconEmoji(formIcon)}</Text>
                  </View>
                  <Text style={[styles.previewName, { color: colors.text }]}>
                    {formName || 'Nombre de categoría'}
                  </Text>
                  <View style={[styles.previewColorDot, { backgroundColor: formColor }]} />
                </View>
              </View>

              {/* Name Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nombre de la categoría"
                placeholderTextColor={colors.textMuted}
              />

              {/* Type Selector (only for new categories) */}
              {!editingCategory && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tipo</Text>
                  <View style={[styles.typeSelector, { backgroundColor: colors.surfaceSecondary }]}>
                    <Pressable
                      style={[
                        styles.typeButton,
                        formType === 'expense' && [styles.typeButtonActive, { backgroundColor: colors.surface }]
                      ]}
                      onPress={() => setFormType('expense')}
                    >
                      <Text style={styles.typeButtonIcon}>💸</Text>
                      <Text style={[
                        styles.typeButtonText,
                        { color: formType === 'expense' ? colors.text : colors.textSecondary }
                      ]}>
                        Gasto
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.typeButton,
                        formType === 'income' && [styles.typeButtonActive, { backgroundColor: colors.surface }]
                      ]}
                      onPress={() => setFormType('income')}
                    >
                      <Text style={styles.typeButtonIcon}>💰</Text>
                      <Text style={[
                        styles.typeButtonText,
                        { color: formType === 'income' ? colors.text : colors.textSecondary }
                      ]}>
                        Ingreso
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Color Picker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormColor(color)}
                  >
                    {formColor === color && <Text style={styles.colorCheck}>✓</Text>}
                  </Pressable>
                ))}
              </View>

              {/* Icon Picker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Icono</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((icon) => (
                  <Pressable
                    key={icon.name}
                    style={[
                      styles.iconOption,
                      { backgroundColor: colors.surfaceSecondary },
                      formIcon === icon.name && [styles.iconOptionSelected, { backgroundColor: formColor + '25', borderColor: formColor }],
                    ]}
                    onPress={() => setFormIcon(icon.name)}
                  >
                    <Text style={styles.iconOptionText}>{icon.emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={editingCategory ? 'Guardar' : 'Crear'}
                onPress={handleSave}
                loading={createCategory.isPending || updateCategory.isPending}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Auth prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  authText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  // Tabs
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Header
  header: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  // List
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  desktopContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  // Category Card
  categoryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  shadowAndroid: {
    elevation: 2,
  },
  shadowWeb: {
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  // Empty
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
  },
  modalScroll: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
  },
  // Preview
  previewSection: {
    marginBottom: 20,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewIconText: {
    fontSize: 24,
  },
  previewName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  previewColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  // Inputs
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  // Type selector
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  typeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonIcon: {
    fontSize: 16,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Color picker
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  colorCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Icon picker
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionSelected: {
    borderWidth: 2,
  },
  iconOptionText: {
    fontSize: 22,
  },
});
