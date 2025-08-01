import type { Category as APICategory } from '../services/apiService';
import type { Category as FrontendCategory } from '../types';

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
  // Use provided color or fallback to default color
  const color = apiCategory.color || defaultColors[index % defaultColors.length];

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    description: apiCategory.description,
    icon: apiCategory.icon || 'tag', // Keep the icon as a string name
    color: color,
    is_default: apiCategory.is_default,
    is_active: apiCategory.is_active,
    user_id: apiCategory.user_id,
    translations: apiCategory.translations,
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
