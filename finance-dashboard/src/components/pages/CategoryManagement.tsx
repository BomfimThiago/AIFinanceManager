import React, { useState } from 'react';

import {
  Baby,
  Bike,
  Book,
  Briefcase,
  Brush,
  Bus,
  Calculator,
  Calendar,
  Camera,
  Car,
  Cat,
  Clock,
  Cloud,
  Coffee,
  Coins,
  CreditCard,
  Cross,
  Dog,
  DollarSign,
  Dumbbell,
  Edit2,
  Film,
  Fish,
  Flower,
  Fuel,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Hospital,
  Key,
  Laptop,
  Library,
  Loader2,
  Mail,
  MapPin,
  Moon,
  MoreHorizontal,
  Mountain,
  Music,
  Palette,
  Pencil,
  Phone,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Plus,
  Receipt,
  Ruler,
  Scissors,
  Shield,
  Shirt,
  ShoppingBag,
  Star,
  Stethoscope,
  Sun,
  Tag,
  Train,
  Trash2,
  TreePine,
  Trophy,
  Umbrella,
  UserCheck,
  Users,
  Utensils,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useCategoryTranslation } from '../../contexts/LanguageContext';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../hooks/queries';
import { useAppNotifications } from '../../hooks/useAppNotifications';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import type { Category } from '../../services/apiService';
import { getUserFriendlyError } from '../../utils/errorMessages';
import ConfirmationModal from '../ui/ConfirmationModal';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface CategoryManagementProps {}

const DEFAULT_COLORS = [
  // Reds & Pinks
  '#FF6B6B',
  '#FF5722',
  '#F44336',
  '#E91E63',
  '#FD79A8',
  '#FF4081',
  '#C62828',
  '#AD1457',
  '#FF8A80',
  '#FF6D00',
  '#D32F2F',
  '#880E4F',
  '#FFCDD2',
  '#FCE4EC',

  // Oranges & Yellows
  '#FF9800',
  '#FF6F00',
  '#FFA726',
  '#FFB74D',
  '#FFEAA7',
  '#FDCB6E',
  '#F39C12',
  '#E67E22',
  '#FFF3E0',
  '#FFF8E1',
  '#FFCC02',
  '#FFC107',
  '#FFD54F',
  '#FFEB3B',

  // Greens
  '#4CAF50',
  '#00B894',
  '#96CEB4',
  '#8BC34A',
  '#009688',
  '#4DB6AC',
  '#66BB6A',
  '#81C784',
  '#A5D6A7',
  '#C8E6C9',
  '#00E676',
  '#69F0AE',
  '#2E7D32',
  '#1B5E20',
  '#00C853',
  '#00BFA5',

  // Blues
  '#45B7D1',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#74B9FF',
  '#3F51B5',
  '#1976D2',
  '#0277BD',
  '#81ECEC',
  '#BBDEFB',
  '#E3F2FD',
  '#006064',
  '#0288D1',
  '#039BE5',
  '#29B6F6',
  '#4FC3F7',

  // Purples & Indigos
  '#6C5CE7',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#A29BFE',
  '#7C4DFF',
  '#651FFF',
  '#6200EA',
  '#BA68C8',
  '#CE93D8',
  '#E1BEE7',
  '#F3E5F5',
  '#8E24AA',
  '#7B1FA2',
  '#4A148C',
  '#AA00FF',

  // Teals & Cyans
  '#4ECDC4',
  '#26A69A',
  '#00ACC1',
  '#00BCD4',
  '#B2DFDB',
  '#E0F2F1',
  '#1DE9B6',
  '#64FFDA',
  '#18FFFF',
  '#00E5FF',
  '#00B8D4',
  '#0097A7',
  '#006064',
  '#004D40',

  // Browns & Warm Tones
  '#8D6E63',
  '#A1887F',
  '#BCAAA4',
  '#D7CCC8',
  '#EFEBE9',
  '#3E2723',
  '#5D4037',
  '#6D4C41',
  '#795548',
  '#8BC34A',
  '#689F38',
  '#558B2F',
  '#33691E',
  '#827717',

  // Grays & Neutrals
  '#636E72',
  '#2D3436',
  '#95A5A6',
  '#BDC3C7',
  '#ECF0F1',
  '#34495E',
  '#2C3E50',
  '#7F8C8D',
  '#DADDE1',
  '#F8F9FA',
  '#E9ECEF',
  '#DEE2E6',
  '#CED4DA',
  '#ADB5BD',
  '#6C757D',
  '#495057',

  // Special & Accent Colors
  '#FF1744',
  '#FF3D00',
  '#FF6D00',
  '#FF9100',
  '#C6FF00',
  '#76FF03',
  '#00E676',
  '#1DE9B6',
  '#00E5FF',
  '#2979FF',
  '#3D5AFE',
  '#651FFF',
  '#D500F9',
  '#C51162',
];

const DEFAULT_ICONS = [
  // Food & Dining
  'utensils',
  'coffee',
  'pizza',
  // Transportation
  'car',
  'bike',
  'bus',
  'train',
  'plane',
  'fuel',
  // Shopping & Money
  'shopping-bag',
  'shirt',
  'gift',
  'dollar-sign',
  'credit-card',
  'piggy-bank',
  'coins',
  'calculator',
  'receipt',
  // Entertainment & Media
  'film',
  'gamepad2',
  'music',
  'camera',
  'book',
  // Home & Living
  'home',
  'zap',
  'wrench',
  'scissors',
  'brush',
  // Health & Medical
  'heart',
  'stethoscope',
  'pill',
  'hospital',
  'cross',
  // Technology
  'laptop',
  'phone',
  'shield',
  // Work & Education
  'briefcase',
  'graduation-cap',
  'library',
  'pencil',
  'ruler',
  // Sports & Fitness
  'dumbbell',
  'trophy',
  // Nature & Weather
  'sun',
  'moon',
  'cloud',
  'umbrella',
  'flower',
  'tree-pine',
  'mountain',
  // Pets & Animals
  'dog',
  'cat',
  'fish',
  'baby',
  // Places & Navigation
  'map-pin',
  'globe',
  // Time & Communication
  'clock',
  'calendar',
  'mail',
  // People & Social
  'users',
  'user-check',
  // Miscellaneous
  'tag',
  'key',
  'star',
  'more-horizontal',
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
  className = 'w-5 h-5',
  color,
}) => {
  const IconComponent = iconMap[iconName] || Tag;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};

const CategoryManagement: React.FC<CategoryManagementProps> = () => {
  const { showSuccess, showError } = useAppNotifications();
  const {
    formatShortDate,
    formatLongDate,
    formatDateTime,
    formatRelativeDate,
    formatMonthYear,
    getLocale,
  } = useDateFormatter();

  // React Query hooks
  const { data: categoriesData, isLoading, error } = useCategories(true);
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const categories = categoriesData?.categories || [];
  const { t, tCategory, tCategoryDescription } = useCategoryTranslation(categories);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0],
  });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; category: Category | null }>({
    show: false,
    category: null,
  });

  // Handle error state
  React.useEffect(() => {
    if (error) {
      showError(t('common.error'), t('categories.failedToLoad'));
    }
  }, [error, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: formData,
        });
        showSuccess(t('common.success'), t('categories.updateSuccess'));
      } else {
        await createCategoryMutation.mutateAsync(formData);
        showSuccess(t('common.success'), t('categories.createSuccess'));
      }
      resetForm();
    } catch (error: any) {
      console.error('Save category error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || DEFAULT_COLORS[0],
      icon: category.icon || DEFAULT_ICONS[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      showSuccess(t('common.success'), t('categories.deleteSuccess'));
    } catch (error: any) {
      console.error('Delete category error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }

    setDeleteModal({ show: false, category: null });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0],
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
        <span className="ml-2 text-gray-600">{t('categories.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Responsive like Integrations page */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h1>
          <p className="text-gray-600 mt-1">{t('categories.subtitle')}</p>
        </div>
      </div>

      {/* Custom Categories */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            {t('categories.customCategories')}
          </h3>
          <button
            onClick={() => setShowForm(true)}
            disabled={createCategoryMutation.isPending}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center sm:justify-start space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" />
            <span>{t('categories.addCategory')}</span>
          </button>
        </div>

        {/* Category Modal - Responsive */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-7xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sm:rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {editingCategory
                      ? t('categories.editCategory')
                      : t('categories.addNewCategory')}
                  </h4>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                {/* Top Section - Form Fields - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('categories.categoryName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
                      placeholder={t('categories.namePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('common.description')}
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
                      placeholder={t('categories.descriptionPlaceholder')}
                    />
                  </div>
                </div>

                {/* Main Section - Color/Icon Selection with Preview - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                  {/* Color Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">
                        {t('categories.chooseColor')}
                      </label>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3">
                        {DEFAULT_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg ${
                              formData.color === color
                                ? 'border-gray-800 scale-110 shadow-lg ring-2 ring-gray-400'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center mt-3 space-x-2">
                        <span className="text-xs sm:text-sm text-gray-500">
                          {t('categories.selected')}:
                        </span>
                        <div
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg border border-gray-300"
                          style={{ backgroundColor: formData.color }}
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {formData.color}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Icon Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">
                        {t('categories.chooseIcon')}
                      </label>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3">
                        {DEFAULT_ICONS.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, icon }))}
                            className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg border-2 flex items-center justify-center transition-all hover:bg-gray-50 hover:shadow-md ${
                              formData.icon === icon
                                ? 'border-green-500 bg-green-50 shadow-md'
                                : 'border-gray-300 bg-white'
                            }`}
                            title={icon}
                          >
                            <CategoryIcon
                              iconName={icon}
                              className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                              color={formData.icon === icon ? '#10b981' : '#6b7280'}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-3">
                        {t('categories.selected')}:{' '}
                        <span className="font-medium">{formData.icon}</span>
                      </p>
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="space-y-4 lg:col-span-2 xl:col-span-1">
                    <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">
                      {t('categories.livePreview')}
                    </label>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 rounded-xl border-2 border-dashed border-gray-300 sticky top-4 sm:top-20">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <div className="flex justify-center">
                          <div
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{
                              backgroundColor: `${formData.color}20`,
                              border: `2px solid ${formData.color}40`,
                            }}
                          >
                            <CategoryIcon
                              iconName={formData.icon}
                              className="w-8 h-8 sm:w-10 sm:h-10"
                              color={formData.color}
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg sm:text-xl">
                            {formData.name || t('categories.categoryName')}
                          </h3>
                          <p className="text-gray-600 mt-1 text-sm sm:text-base">
                            {formData.description || t('categories.noDescription')}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500 pt-3 sm:pt-4 border-t border-gray-200">
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

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>
                      {editingCategory ? t('common.update') : t('common.create')}{' '}
                      {t('common.category')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {userCategories.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
            <Tag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {t('categories.noCustomCategories')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {t('categories.createFirstCategory')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {userCategories.map(category => (
              <div key={category.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg border shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <CategoryIcon
                        iconName={category.icon || 'tag'}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        color={category.color}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {tCategory(category.name)}
                      </h4>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {tCategoryDescription(category.description, category.name)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(category)}
                      disabled={updateCategoryMutation.isPending}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('categories.editCategory')}
                    >
                      <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, category })}
                      disabled={deleteCategoryMutation.isPending}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('categories.deleteCategory')}
                    >
                      {deleteCategoryMutation.isPending ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          {t('categories.defaultCategories')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {defaultCategories.map(category => (
            <div key={category.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <CategoryIcon
                      iconName={category.icon || 'tag'}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      color={category.color}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {tCategory(category.name)}
                    </h4>
                    {category.description && (
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {tCategoryDescription(category.description, category.name)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded flex-shrink-0 ml-2">
                  {t('categories.system')}
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
        title={t('categories.deleteCategory')}
        message={`${t('categories.deleteConfirmMessage')} "${deleteModal.category ? tCategory(deleteModal.category.name) : ''}"? ${t('modals.cannotUndo')}`}
        variant="danger"
      />
    </div>
  );
};

export default CategoryManagement;
