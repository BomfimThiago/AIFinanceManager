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
import { Category, CategoryCreate, CategoryType, CategoryUpdate } from '../../types';
import { useAuthStore } from '../../store/authStore';

// Predefined colors for category selection
const CATEGORY_COLORS = [
  '#22c55e', '#f97316', '#3b82f6', '#eab308', '#a855f7',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#06b6d4',
  '#8b5cf6', '#fbbf24', '#0ea5e9', '#64748b', '#f43f5e',
  '#10b981', '#6b7280',
];

// Predefined icons (using icon names that match the backend)
const CATEGORY_ICONS = [
  { name: 'cart', label: 'Cart' },
  { name: 'utensils', label: 'Dining' },
  { name: 'car', label: 'Car' },
  { name: 'lightbulb', label: 'Utilities' },
  { name: 'film', label: 'Entertainment' },
  { name: 'heart-pulse', label: 'Health' },
  { name: 'shopping-bag', label: 'Shopping' },
  { name: 'home', label: 'Home' },
  { name: 'book-open', label: 'Education' },
  { name: 'plane', label: 'Travel' },
  { name: 'key', label: 'Key' },
  { name: 'zap', label: 'Energy' },
  { name: 'wifi', label: 'Internet' },
  { name: 'shield', label: 'Shield' },
  { name: 'repeat', label: 'Repeat' },
  { name: 'briefcase', label: 'Work' },
  { name: 'laptop', label: 'Laptop' },
  { name: 'gift', label: 'Gift' },
  { name: 'trending-up', label: 'Growth' },
  { name: 'plus-circle', label: 'Plus' },
  { name: 'package', label: 'Package' },
];

type TabType = 'expense' | 'income';

export default function CategoriesScreen() {
  const { isMobile } = useResponsive();
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
  const [formColor, setFormColor] = useState('#6b7280');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredCategories = categories?.filter((c) => c.type === activeTab) || [];
  const expenseCount = categories?.filter((c) => c.type === 'expense').length || 0;
  const incomeCount = categories?.filter((c) => c.type === 'income').length || 0;

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(activeTab);
    setFormIcon('package');
    setFormColor('#6b7280');
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Edit', 'Default categories cannot be edited. You can hide them instead.');
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
      Alert.alert('Error', 'Category name is required');
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted. You can hide them instead.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(category.id);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update category');
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeCategories.mutateAsync();
      Alert.alert('Success', 'Categories initialized successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to initialize categories');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authText}>Please log in to manage categories</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Card style={[styles.categoryCard, item.isHidden && styles.hiddenCard]}>
      <View style={styles.categoryRow}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Text style={styles.iconText}>{getIconEmoji(item.icon)}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, item.isHidden && styles.hiddenText]}>
            {item.name}
          </Text>
          <View style={styles.badges}>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
            {item.isHidden && (
              <View style={styles.hiddenBadge}>
                <Text style={styles.hiddenBadgeText}>Hidden</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleToggleVisibility(item)}
          >
            <Text>{item.isHidden ? '👁️' : '🙈'}</Text>
          </Pressable>
          {!item.isDefault && (
            <>
              <Pressable
                style={styles.actionButton}
                onPress={() => openEditModal(item)}
              >
                <Text>✏️</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleDelete(item)}
              >
                <Text>🗑️</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>
            Expenses ({expenseCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            Income ({incomeCount})
          </Text>
        </Pressable>
      </View>

      {/* Add Category Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title={`+ Add ${activeTab === 'expense' ? 'Expense' : 'Income'} Category`}
          onPress={openCreateModal}
        />
        {(!categories || categories.length === 0) && (
          <Button
            title="Initialize Default Categories"
            variant="outline"
            onPress={handleInitialize}
            style={{ marginTop: 8 }}
          />
        )}
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab} categories yet.
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="Category name"
            />

            {!editingCategory && (
              <>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  <Pressable
                    style={[styles.typeButton, formType === 'expense' && styles.typeButtonActive]}
                    onPress={() => setFormType('expense')}
                  >
                    <Text style={[styles.typeButtonText, formType === 'expense' && styles.typeButtonTextActive]}>
                      Expense
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.typeButton, formType === 'income' && styles.typeButtonActive]}
                    onPress={() => setFormType('income')}
                  >
                    <Text style={[styles.typeButtonText, formType === 'income' && styles.typeButtonTextActive]}>
                      Income
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>Color</Text>
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
                />
              ))}
            </View>

            <Text style={styles.inputLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.slice(0, 12).map((icon) => (
                <Pressable
                  key={icon.name}
                  style={[
                    styles.iconOption,
                    formIcon === icon.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => setFormIcon(icon.name)}
                >
                  <Text style={styles.iconOptionText}>{getIconEmoji(icon.name)}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save"
                onPress={handleSave}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authText: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  categoryCard: {
    marginBottom: 8,
  },
  hiddenCard: {
    opacity: 0.6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  hiddenText: {
    color: '#9ca3af',
  },
  badges: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
  },
  defaultBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  hiddenBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiddenBadgeText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#1f2937',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionSelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  iconOptionText: {
    fontSize: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
});
