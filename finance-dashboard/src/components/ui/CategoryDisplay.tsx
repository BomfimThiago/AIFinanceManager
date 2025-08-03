import React from 'react';

import { useCategoryTranslation } from '../../contexts/LanguageContext';
import type { Category } from '../../types';
import { CategoryIcon } from '../../utils/categoryIcons';

interface CategoryDisplayProps {
  category: Category;
  variant?: 'inline' | 'badge' | 'compact' | 'full';
  showIcon?: boolean;
  showName?: boolean;
  className?: string;
  onClick?: () => void;
  allCategories?: Category[]; // Optional full categories array for better translation
}

const CategoryDisplay: React.FC<CategoryDisplayProps> = ({
  category,
  variant = 'inline',
  showIcon = true,
  showName = true,
  className = '',
  onClick,
  allCategories,
}) => {
  // Use full categories array if provided, otherwise use single category
  const categoriesForTranslation = allCategories || [category];
  const { tCategory } = useCategoryTranslation(categoriesForTranslation);
  const translatedName = tCategory(category.name);

  const baseClasses = onClick ? 'cursor-pointer' : '';

  switch (variant) {
    case 'badge':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${baseClasses} ${className}`}
          style={{ backgroundColor: `${category.color}20`, color: category.color }}
          onClick={onClick}
        >
          {showIcon && (
            <CategoryIcon
              iconName={category.icon}
              className="w-3 h-3 mr-1"
              color={category.color}
            />
          )}
          {showName && translatedName}
        </span>
      );

    case 'compact':
      return (
        <div
          className={`flex items-center space-x-2 ${baseClasses} ${className}`}
          onClick={onClick}
        >
          {showIcon && (
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon
                iconName={category.icon}
                className="w-3.5 h-3.5"
                color={category.color}
              />
            </div>
          )}
          {showName && <span className="text-sm text-gray-700">{translatedName}</span>}
        </div>
      );

    case 'full':
      return (
        <div
          className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 ${baseClasses} ${className}`}
          onClick={onClick}
        >
          {showIcon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon iconName={category.icon} className="w-4 h-4" color={category.color} />
            </div>
          )}
          {showName && (
            <span className="text-sm font-medium" style={{ color: category.color }}>
              {translatedName}
            </span>
          )}
        </div>
      );

    case 'inline':
    default:
      return (
        <div
          className={`inline-flex items-center space-x-2 ${baseClasses} ${className}`}
          onClick={onClick}
        >
          {showIcon && (
            <CategoryIcon iconName={category.icon} className="w-4 h-4" color={category.color} />
          )}
          {showName && <span className="text-sm">{translatedName}</span>}
        </div>
      );
  }
};

export default CategoryDisplay;
