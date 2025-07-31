import {
  Book,
  Car,
  CreditCard,
  DollarSign,
  Dumbbell,
  Film,
  Gift,
  Heart,
  Home,
  Laptop,
  MoreHorizontal,
  Plane,
  Shirt,
  ShoppingBag,
  Tag,
  Utensils,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Category as APICategory } from '../services/apiService';
import type { Category as FrontendCategory } from '../types';

// Map icon strings to Lucide components
const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  film: Film,
  zap: Zap,
  heart: Heart,
  book: Book,
  home: Home,
  shirt: Shirt,
  laptop: Laptop,
  dumbbell: Dumbbell,
  plane: Plane,
  gift: Gift,
  'more-horizontal': MoreHorizontal,
  tag: Tag,
  'dollar-sign': DollarSign,
  // Fallback icons
  dollar: DollarSign,
  'credit-card': CreditCard,
};

// Default colors for categories that don't have one
const defaultColors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#FD79A8',
  '#6C5CE7',
  '#A29BFE',
  '#74B9FF',
  '#00B894',
  '#FDCB6E',
  '#E17055',
  '#81ECEC',
  '#636E72',
  '#2D3436',
];

/**
 * Convert an API category to a frontend category
 */
export function convertAPICategory(apiCategory: APICategory, index: number = 0): FrontendCategory {
  // Get icon component, fallback to Tag if not found
  const iconComponent = apiCategory.icon ? iconMap[apiCategory.icon] || Tag : Tag;

  // Use provided color or fallback to default color
  const color = apiCategory.color || defaultColors[index % defaultColors.length];

  return {
    name: apiCategory.name,
    icon: iconComponent,
    color: color,
  };
}

/**
 * Convert an array of API categories to frontend categories
 */
export function convertAPICategoriesList(apiCategories: APICategory[]): FrontendCategory[] {
  return apiCategories.map((apiCategory, index) => convertAPICategory(apiCategory, index));
}

/**
 * Get a frontend category by name from API categories
 */
export function getFrontendCategoryByName(
  apiCategories: APICategory[],
  categoryName: string,
  fallbackIndex: number = 0
): FrontendCategory | undefined {
  const apiCategory = apiCategories.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (!apiCategory) return undefined;

  return convertAPICategory(apiCategory, fallbackIndex);
}

/**
 * Create a map of category names to frontend categories for quick lookup
 */
export function createCategoryMap(apiCategories: APICategory[]): Record<string, FrontendCategory> {
  const map: Record<string, FrontendCategory> = {};

  apiCategories.forEach((apiCategory, index) => {
    const frontendCategory = convertAPICategory(apiCategory, index);
    map[apiCategory.name.toLowerCase()] = frontendCategory;
  });

  return map;
}
