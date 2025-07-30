import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, X, Palette, Tag, Loader2,
  Utensils, Car, ShoppingBag, Film, Zap, Heart, Book, Home, 
  Shirt, Laptop, Dumbbell, Plane, Gift, MoreHorizontal, DollarSign, CreditCard,
  Coffee, Pizza, Gamepad2, Music, Camera, Brush, Scissors, Wrench, 
  MapPin, Clock, Calendar, Mail, Phone, Shield, Key, Trophy,
  Star, Sun, Moon, Cloud, Umbrella, Flower, TreePine, Mountain,
  Bike, Bus, Train, Fuel, PiggyBank, Coins, Calculator, Receipt,
  Stethoscope, Pill, Hospital, Cross, Baby, Dog, Cat, Fish,
  Briefcase, GraduationCap, Library, Pencil, Ruler, Globe, Users, UserCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import ConfirmationModal from '../ui/ConfirmationModal';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '../../hooks/queries';
import type { Category } from '../../services/apiService';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface CategoryManagementProps {}

const DEFAULT_COLORS = [
  // Reds & Pinks
  '#FF6B6B', '#FF5722', '#F44336', '#E91E63', '#FD79A8', '#FF4081', '#C62828', '#AD1457',
  '#FF8A80', '#FF6D00', '#D32F2F', '#880E4F', '#FFCDD2', '#FCE4EC',
  
  // Oranges & Yellows
  '#FF9800', '#FF6F00', '#FFA726', '#FFB74D', '#FFEAA7', '#FDCB6E', '#F39C12', '#E67E22',
  '#FFF3E0', '#FFF8E1', '#FFCC02', '#FFC107', '#FFD54F', '#FFEB3B',
  
  // Greens
  '#4CAF50', '#00B894', '#96CEB4', '#8BC34A', '#009688', '#4DB6AC', '#66BB6A', '#81C784',
  '#A5D6A7', '#C8E6C9', '#00E676', '#69F0AE', '#2E7D32', '#1B5E20', '#00C853', '#00BFA5',
  
  // Blues
  '#45B7D1', '#2196F3', '#03A9F4', '#00BCD4', '#74B9FF', '#3F51B5', '#1976D2', '#0277BD',
  '#81ECEC', '#BBDEFB', '#E3F2FD', '#006064', '#0288D1', '#039BE5', '#29B6F6', '#4FC3F7',
  
  // Purples & Indigos
  '#6C5CE7', '#9C27B0', '#673AB7', '#3F51B5', '#A29BFE', '#7C4DFF', '#651FFF', '#6200EA',
  '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5', '#8E24AA', '#7B1FA2', '#4A148C', '#AA00FF',
  
  // Teals & Cyans
  '#4ECDC4', '#26A69A', '#00ACC1', '#00BCD4', '#B2DFDB', '#E0F2F1', '#1DE9B6', '#64FFDA',
  '#18FFFF', '#00E5FF', '#00B8D4', '#0097A7', '#006064', '#004D40',
  
  // Browns & Warm Tones
  '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9', '#3E2723', '#5D4037', '#6D4C41',
  '#795548', '#8BC34A', '#689F38', '#558B2F', '#33691E', '#827717',
  
  // Grays & Neutrals
  '#636E72', '#2D3436', '#95A5A6', '#BDC3C7', '#ECF0F1', '#34495E', '#2C3E50', '#7F8C8D',
  '#DADDE1', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057',
  
  // Special & Accent Colors
  '#FF1744', '#FF3D00', '#FF6D00', '#FF9100', '#C6FF00', '#76FF03', '#00E676', '#1DE9B6',
  '#00E5FF', '#2979FF', '#3D5AFE', '#651FFF', '#D500F9', '#C51162'
];

const DEFAULT_ICONS = [
  // Food & Dining
  'utensils', 'coffee', 'pizza',
  // Transportation
  'car', 'bike', 'bus', 'train', 'plane', 'fuel',
  // Shopping & Money
  'shopping-bag', 'shirt', 'gift', 'dollar-sign', 'credit-card', 'piggy-bank', 'coins', 'calculator', 'receipt',
  // Entertainment & Media
  'film', 'gamepad2', 'music', 'camera', 'book',
  // Home & Living
  'home', 'zap', 'wrench', 'scissors', 'brush',
  // Health & Medical
  'heart', 'stethoscope', 'pill', 'hospital', 'cross',
  // Technology
  'laptop', 'phone', 'shield',
  // Work & Education
  'briefcase', 'graduation-cap', 'library', 'pencil', 'ruler',
  // Sports & Fitness
  'dumbbell', 'trophy',
  // Nature & Weather
  'sun', 'moon', 'cloud', 'umbrella', 'flower', 'tree-pine', 'mountain',
  // Pets & Animals
  'dog', 'cat', 'fish', 'baby',
  // Places & Navigation
  'map-pin', 'globe',
  // Time & Communication
  'clock', 'calendar', 'mail',
  // People & Social
  'users', 'user-check',
  // Miscellaneous
  'tag', 'key', 'star', 'more-horizontal'
];

// Map icon strings to Lucide components
const iconMap: Record<string, LucideIcon> = {
  // Food & Dining
  utensils: Utensils,
  coffee: Coffee,
  pizza: Pizza,
  // Transportation
  car: Car,
  bike: Bike,
  bus: Bus,
  train: Train,
  plane: Plane,
  fuel: Fuel,
  // Shopping & Money
  'shopping-bag': ShoppingBag,
  shirt: Shirt,
  gift: Gift,
  'dollar-sign': DollarSign,
  dollar: DollarSign,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  coins: Coins,
  calculator: Calculator,
  receipt: Receipt,
  // Entertainment & Media
  film: Film,
  gamepad2: Gamepad2,
  music: Music,
  camera: Camera,
  book: Book,
  // Home & Living
  home: Home,
  zap: Zap,
  wrench: Wrench,
  scissors: Scissors,
  brush: Brush,
  // Health & Medical
  heart: Heart,
  stethoscope: Stethoscope,
  pill: Pill,
  hospital: Hospital,
  cross: Cross,
  // Technology
  laptop: Laptop,
  phone: Phone,
  shield: Shield,
  // Work & Education
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  library: Library,
  pencil: Pencil,
  ruler: Ruler,
  // Sports & Fitness
  dumbbell: Dumbbell,
  trophy: Trophy,
  // Nature & Weather
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  umbrella: Umbrella,
  flower: Flower,
  'tree-pine': TreePine,
  mountain: Mountain,
  // Pets & Animals
  dog: Dog,
  cat: Cat,
  fish: Fish,
  baby: Baby,
  // Places & Navigation
  'map-pin': MapPin,
  globe: Globe,
  // Time & Communication
  clock: Clock,
  calendar: Calendar,
  mail: Mail,
  // People & Social
  users: Users,
  'user-check': UserCheck,
  // Miscellaneous
  tag: Tag,
  key: Key,
  star: Star,
  'more-horizontal': MoreHorizontal,
};

// Component to render category icon
const CategoryIcon: React.FC<{ iconName: string; className?: string; color?: string }> = ({ 
  iconName, 
  className = "w-5 h-5", 
  color 
}) => {
  const IconComponent = iconMap[iconName] || Tag;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};

const CategoryManagement: React.FC<CategoryManagementProps> = () => {
  const { addNotification } = useNotificationContext();
  
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
      addNotification('error', 'Error', 'Failed to load categories');
    }
  }, [error, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: formData
        });
        addNotification('success', 'Success', 'Category updated successfully');
      } else {
        await createCategoryMutation.mutateAsync(formData);
        addNotification('success', 'Success', 'Category created successfully');
      }
      resetForm();
    } catch (error: any) {
      console.error('Save category error:', error);
      const friendlyError = getUserFriendlyError(error);
      addNotification('error', friendlyError.title, friendlyError.message);
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
      addNotification('success', 'Success', 'Category deleted successfully');
    } catch (error: any) {
      console.error('Delete category error:', error);
      const friendlyError = getUserFriendlyError(error);
      addNotification('error', friendlyError.title, friendlyError.message);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
      </div>

      {/* Custom Categories */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Your Custom Categories
          </h3>
          <button
            onClick={() => setShowForm(true)}
            disabled={createCategoryMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Category Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-semibold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h4>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                {/* Top Section - Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                      placeholder="e.g., Dining Out"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Brief description"
                    />
                  </div>
                </div>

                {/* Main Section - Color/Icon Selection with Preview */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Color Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-4">
                        Choose Color
                      </label>
                      <div className="grid grid-cols-8 gap-3">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg ${
                              formData.color === color ? 'border-gray-800 scale-110 shadow-lg ring-2 ring-gray-400' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center mt-3 space-x-2">
                        <span className="text-sm text-gray-500">Selected:</span>
                        <div 
                          className="w-5 h-5 rounded-lg border border-gray-300"
                          style={{ backgroundColor: formData.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">{formData.color}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Icon Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-4">
                        Choose Icon
                      </label>
                      <div className="grid grid-cols-8 gap-3">
                        {DEFAULT_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, icon }))}
                            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all hover:bg-gray-50 hover:shadow-md ${
                              formData.icon === icon 
                                ? 'border-green-500 bg-green-50 shadow-md' 
                                : 'border-gray-300 bg-white'
                            }`}
                            title={icon}
                          >
                            <CategoryIcon 
                              iconName={icon}
                              className="w-6 h-6"
                              color={formData.icon === icon ? '#10b981' : '#6b7280'}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        Selected: <span className="font-medium">{formData.icon}</span>
                      </p>
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="space-y-4">
                    <label className="block text-lg font-medium text-gray-700 mb-4">
                      Live Preview
                    </label>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-dashed border-gray-300 sticky top-20">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <div 
                            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: `${formData.color}20`, border: `2px solid ${formData.color}40` }}
                          >
                            <CategoryIcon 
                              iconName={formData.icon}
                              className="w-10 h-10"
                              color={formData.color}
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl">{formData.name || 'Category Name'}</h3>
                          <p className="text-gray-600 mt-1">{formData.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: formData.color }}
                            />
                            <span>{formData.color}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CategoryIcon iconName={formData.icon} className="w-3 h-3" />
                            <span>{formData.icon}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>{editingCategory ? 'Update' : 'Create'} Category</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {userCategories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Categories</h3>
            <p className="text-gray-500">Create your first custom category to get started.</p>
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
                      <CategoryIcon 
                        iconName={category.icon || 'tag'}
                        className="w-5 h-5"
                        color={category.color}
                      />
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
                    <CategoryIcon 
                      iconName={category.icon || 'tag'}
                      className="w-5 h-5"
                      color={category.color}
                    />
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