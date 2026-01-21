// src/app/(tabs)/categories.tsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/Input';
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
import { getTheme, radius, getShadow, colors } from '../../constants/theme';

const CATEGORY_COLORS = [
  '#22c55e', '#f97316', '#3b82f6', '#eab308', '#a855f7',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#06b6d4',
  '#8b5cf6', '#fbbf24', '#0ea5e9', '#64748b', '#f43f5e',
  '#10b981', '#6b7280',
];

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

const getIconEmoji = (iconName: string) => CATEGORY_ICONS.find((i) => i.name === iconName)?.emoji || '📦';

type TabType = 'expense' | 'income';

export default function CategoriesScreen() {
  const { horizontalPadding, isDesktop } = useResponsive();
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
  const [formColor, setFormColor] = useState('#7c3aed');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredCategories = categories?.filter((c) => c.type === activeTab) || [];
  const expenseCount = categories?.filter((c) => c.type === 'expense').length || 0;
  const incomeCount = categories?.filter((c) => c.type === 'income').length || 0;
  const visibleCount = filteredCategories.filter((c) => !c.isHidden).length;
  const hiddenCount = filteredCategories.filter((c) => c.isHidden).length;

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
      Alert.alert('Error', 'El nombre es obligatorio');
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al guardar');
    }
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('No se puede eliminar', 'Las categorías predeterminadas no se pueden eliminar. Puedes ocultarlas.');
      return;
    }
    Alert.alert('Eliminar Categoría', `¿Eliminar "${category.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory.mutateAsync(category.id);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Error al eliminar');
          }
        },
      },
    ]);
  };

  const handleToggleVisibility = async (category: Category) => {
    try {
      if (category.isHidden) {
        await unhideCategory.mutateAsync(category.id);
      } else {
        await hideCategory.mutateAsync(category.id);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar');
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeCategories.mutateAsync();
      Alert.alert('Éxito', 'Categorías inicializadas exitosamente');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al inicializar');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.authPrompt}>
          <Text style={styles.authIcon}>🏷️</Text>
          <Text style={[styles.authTitle, { color: theme.text }]}>Gestiona tus Categorías</Text>
          <Text style={[styles.authSubtitle, { color: theme.textSecondary }]}>
            Inicia sesión para crear categorías personalizadas
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
      {/* Stats */}
      <Card variant="glass" style={styles.statsCard}>
        <View style={styles.statsRow}>
          {[
            { label: 'Activas', value: visibleCount, color: theme.primary },
            { label: 'Ocultas', value: hiddenCount, color: theme.textMuted },
            { label: 'Total', value: filteredCategories.length, color: colors.success.main },
          ].map(({ label, value, color }, i) => (
            <View key={label} style={[styles.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.divider }]}>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Add Button */}
      <Button title="➕ Nueva Categoría" onPress={openCreateModal} fullWidth style={{ marginBottom: 16 }} />

      {(!categories || categories.length === 0) && (
        <Button
          title="Inicializar Categorías por Defecto"
          variant="outline"
          onPress={handleInitialize}
          fullWidth
          style={{ marginBottom: 16 }}
        />
      )}

      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
        {activeTab === 'expense' ? 'CATEGORÍAS DE GASTO' : 'CATEGORÍAS DE INGRESO'}
      </Text>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Pressable onPress={() => openEditModal(item)}>
      <Card variant="glass" style={[styles.categoryCard, item.isHidden && { opacity: 0.6 }]}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryIcon, { backgroundColor: `${item.color}25` }]}>
            <Text style={styles.categoryEmoji}>{getIconEmoji(item.icon)}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
            <View style={styles.badges}>
              {item.isDefault && (
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: theme.primary }]}>Sistema</Text>
                </View>
              )}
              {item.isHidden && (
                <View style={[styles.badge, { backgroundColor: colors.danger.light }]}>
                  <Text style={[styles.badgeText, { color: colors.danger.main }]}>Oculta</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => handleToggleVisibility(item)}
            >
              <Text style={styles.actionIcon}>{item.isHidden ? '👁️' : '🙈'}</Text>
            </Pressable>
            {!item.isDefault && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.danger.light }]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      {/* Tab Toggle */}
      <View style={{ paddingHorizontal: horizontalPadding, paddingVertical: 12 }}>
        <SegmentedControl
          options={[
            { key: 'expense', label: `Gastos (${expenseCount})`, icon: '💸' },
            { key: 'income', label: `Ingresos (${incomeCount})`, icon: '💰' },
          ]}
          selected={activeTab}
          onChange={(key) => setActiveTab(key as TabType)}
        />
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[{ paddingHorizontal: horizontalPadding, paddingBottom: 100 }, isDesktop && styles.desktopContent]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin categorías</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Crea tu primera categoría de {activeTab === 'expense' ? 'gasto' : 'ingreso'}
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalClose, { color: theme.textMuted }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Preview */}
              <View style={[styles.preview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.05)' }]}>
                <View style={[styles.previewIcon, { backgroundColor: `${formColor}25` }]}>
                  <Text style={styles.previewEmoji}>{getIconEmoji(formIcon)}</Text>
                </View>
                <Text style={[styles.previewName, { color: theme.text }]}>{formName || 'Nueva Categoría'}</Text>
                <View style={[styles.previewDot, { backgroundColor: formColor }]} />
              </View>

              {/* Name */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nombre</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="Nombre de la categoría"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.05)',
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />

              {/* Type Selector (only for new categories) */}
              {!editingCategory && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Tipo</Text>
                  <View style={[styles.typeSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Pressable
                      style={[
                        styles.typeButton,
                        formType === 'expense' && [styles.typeButtonActive, { backgroundColor: theme.surface }],
                      ]}
                      onPress={() => setFormType('expense')}
                    >
                      <Text style={styles.typeButtonIcon}>💸</Text>
                      <Text style={[styles.typeButtonText, { color: formType === 'expense' ? theme.text : theme.textSecondary }]}>
                        Gasto
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.typeButton,
                        formType === 'income' && [styles.typeButtonActive, { backgroundColor: theme.surface }],
                      ]}
                      onPress={() => setFormType('income')}
                    >
                      <Text style={styles.typeButtonIcon}>💰</Text>
                      <Text style={[styles.typeButtonText, { color: formType === 'income' ? theme.text : theme.textSecondary }]}>
                        Ingreso
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Color Picker */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setFormColor(color)}
                    style={[styles.colorOption, { backgroundColor: color }, formColor === color && styles.colorSelected]}
                  >
                    {formColor === color && <Text style={styles.colorCheck}>✓</Text>}
                  </Pressable>
                ))}
              </View>

              {/* Icon Picker */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Icono</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((icon) => (
                  <Pressable
                    key={icon.name}
                    onPress={() => setFormIcon(icon.name)}
                    style={[
                      styles.iconOption,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                      formIcon === icon.name && {
                        backgroundColor: `${formColor}25`,
                        borderColor: formColor,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.divider }]}>
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
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  authIcon: { fontSize: 64, marginBottom: 16 },
  authTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  authSubtitle: { fontSize: 15, marginBottom: 24, textAlign: 'center' },
  headerContent: { marginBottom: 8 },
  statsCard: { marginBottom: 16 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  categoryCard: { padding: 14 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  categoryEmoji: { fontSize: 26 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionIcon: { fontSize: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '90%', borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { fontSize: 24 },
  modalScroll: { padding: 20 },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1 },
  preview: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.xl, marginBottom: 20 },
  previewIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  previewEmoji: { fontSize: 28 },
  previewName: { flex: 1, fontSize: 18, fontWeight: '600' },
  previewDot: { width: 16, height: 16, borderRadius: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  textInput: { borderWidth: 2, borderRadius: radius.lg, padding: 16, fontSize: 16 },
  typeSelector: { flexDirection: 'row', borderRadius: radius.lg, padding: 4 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.md, gap: 6 },
  typeButtonActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  typeButtonIcon: { fontSize: 16 },
  typeButtonText: { fontSize: 14, fontWeight: '600' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  colorCheck: { color: '#FFFFFF', fontWeight: '700' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  iconOption: { width: 48, height: 48, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { fontSize: 22 },
});
