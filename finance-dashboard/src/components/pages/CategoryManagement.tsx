import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Palette, Tag, Loader2 } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useNotifications } from '../../hooks/useNotifications';
import ConfirmationModal from '../ui/ConfirmationModal';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '../../hooks/queries';
import type { Category, CategoryCreate, CategoryUpdate } from '../../services/apiService';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface CategoryManagementProps {
  hideAmounts: boolean;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#FD79A8', '#6C5CE7', '#A29BFE', '#74B9FF', '#00B894',
  '#FDCB6E', '#E17055', '#81ECEC', '#636E72', '#2D3436'
];

const DEFAULT_ICONS = [
  'utensils', 'car', 'shopping-bag', 'film', 'zap',
  'heart', 'book', 'home', 'shirt', 'laptop',
  'dumbbell', 'plane', 'gift', 'more-horizontal'
];

const CategoryManagement: React.FC<CategoryManagementProps> = ({ hideAmounts }) => {
  const { formatAmount } = useCurrency();
  const { showNotification } = useNotifications();
  
  // React Query hooks
  const { data: categoriesData, isLoading, error } = useCategories(true);
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0]
  });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; category: Category | null }>({
    show: false,
    category: null
  });

  const categories = categoriesData?.categories || [];

  // Handle error state
  React.useEffect(() => {
    if (error) {
      showNotification('Failed to load categories', 'error');
    }
  }, [error, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: formData
        });
        showNotification('Category updated successfully', 'success');
      } else {
        await createCategoryMutation.mutateAsync(formData);
        showNotification('Category created successfully', 'success');
      }
      resetForm();
    } catch (error: any) {
      showNotification(
        error?.response?.data?.detail || 'Failed to save category',
        'error'
      );
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || DEFAULT_COLORS[0],
      icon: category.icon || DEFAULT_ICONS[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      showNotification('Category deleted successfully', 'success');
    } catch (error: any) {
      showNotification(
        error?.response?.data?.detail || 'Failed to delete category',
        'error'
      );
    }
    
    setDeleteModal({ show: false, category: null });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0]
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const userCategories = categories.filter(cat => !cat.is_default);
  const defaultCategories = categories.filter(cat => cat.is_default);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={createCategoryMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Dining Out"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {DEFAULT_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>{editingCategory ? 'Update' : 'Create'} Category</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Default Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Default Categories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {defaultCategories.map((category) => (
            <div key={category.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <div 
                      className="w-5 h-5"
                      style={{ color: category.color }}
                    >
                      {category.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                  System
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Your Custom Categories
        </h3>
        {userCategories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Categories</h3>
            <p className="text-gray-500 mb-4">Create your first custom category to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCategories.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div 
                        className="w-5 h-5"
                        style={{ color: category.color }}
                      >
                        {category.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(category)}
                      disabled={updateCategoryMutation.isPending}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit category"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, category })}
                      disabled={deleteCategoryMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete category"
                    >
                      {deleteCategoryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, category: null })}
        onConfirm={() => deleteModal.category && handleDelete(deleteModal.category)}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deleteModal.category?.name}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
};

export default CategoryManagement;