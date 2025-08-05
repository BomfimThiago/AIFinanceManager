import React, { useEffect, useRef, useState } from 'react';

import { Calendar, Check, ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';

import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useCategories } from '../../hooks/queries';
import { convertAPICategoriesList } from '../../utils/categoryMapper';
import CategoryDisplay from '../ui/CategoryDisplay';

const CompactFiltersBarInternal: React.FC = () => {
  const { t } = useTranslation();
  const { filters, updateFilter, clearFilter, clearFilters, hasActiveFilters, activeFilterCount } =
    useGlobalFilters();
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategories(true);
  const categories = categoriesData?.categories
    ? convertAPICategoriesList(categoriesData.categories)
    : [];

  // Generate month and year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: 1, label: t('months.january', 'January') },
    { value: 2, label: t('months.february', 'February') },
    { value: 3, label: t('months.march', 'March') },
    { value: 4, label: t('months.april', 'April') },
    { value: 5, label: t('months.may', 'May') },
    { value: 6, label: t('months.june', 'June') },
    { value: 7, label: t('months.july', 'July') },
    { value: 8, label: t('months.august', 'August') },
    { value: 9, label: t('months.september', 'September') },
    { value: 10, label: t('months.october', 'October') },
    { value: 11, label: t('months.november', 'November') },
    { value: 12, label: t('months.december', 'December') },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // Debounce search
    setTimeout(() => {
      if (value.trim()) {
        updateFilter('search', value.trim());
      } else {
        clearFilter('search');
      }
    }, 300);
  };

  const handleCategoryToggle = (categoryName: string) => {
    const currentCategories = filters.categories || [];
    if (currentCategories.includes(categoryName)) {
      const newCategories = currentCategories.filter(c => c !== categoryName);
      if (newCategories.length === 0) {
        clearFilter('categories');
      } else {
        updateFilter('categories', newCategories);
      }
    } else {
      updateFilter('categories', [...currentCategories, categoryName]);
    }
  };

  const selectedCategories = filters.categories || [];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Compact Filter Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilterCount > 0
                  ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Filter className={`h-4 w-4 ${activeFilterCount > 0 ? 'text-blue-600' : ''}`} />
              <span>{t('filters.title', 'Filters')}</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  {activeFilterCount}
                </span>
              )}
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Active Filters Count */}
            {activeFilterCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFilterCount}{' '}
                  {activeFilterCount === 1
                    ? t('filters.active', 'active')
                    : t('filters.active', 'active')}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  {t('filters.clearAll', 'Clear All')}
                </button>
              </div>
            )}
          </div>

          {/* Quick Month/Year Display - Always show active filter status */}
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700">
              {filters.month && months.find(m => m.value === filters.month)?.label} {filters.year}
            </span>
            {(filters.categories?.length || 0) > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                +{filters.categories?.length} categories
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {filters.type}
              </span>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="pb-4 space-y-4">
            {/* First Row: Search, Month, Year, Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('filters.searchPlaceholder', 'Search transactions...')}
                  value={localSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {localSearch && (
                  <button
                    onClick={() => {
                      setLocalSearch('');
                      clearFilter('search');
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Month */}
              <select
                value={filters.month || ''}
                onChange={e => {
                  const value = e.target.value;
                  if (value) {
                    updateFilter('month', parseInt(value));
                  } else {
                    clearFilter('month');
                  }
                }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">{t('filters.allMonths', 'All Months')}</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              {/* Year */}
              <select
                value={filters.year || ''}
                onChange={e => {
                  const value = e.target.value;
                  if (value) {
                    updateFilter('year', parseInt(value));
                  } else {
                    clearFilter('year');
                  }
                }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">{t('filters.allYears', 'All Years')}</option>
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              {/* Type */}
              <select
                value={filters.type || ''}
                onChange={e => {
                  const value = e.target.value as 'income' | 'expense' | '';
                  if (value) {
                    updateFilter('type', value);
                  } else {
                    clearFilter('type');
                  }
                }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">{t('filters.allTypes', 'All Types')}</option>
                <option value="expense">{t('filters.expenses', 'Expenses')}</option>
                <option value="income">{t('filters.income', 'Income')}</option>
              </select>
            </div>

            {/* Second Row: Categories Multi-Select Dropdown */}
            {categories.length > 0 && (
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filters.categories', 'Categories')}
                </label>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:bg-gray-50"
                >
                  <span className="text-left">
                    {selectedCategories.length === 0
                      ? t('filters.selectCategories', 'Select categories...')
                      : `${selectedCategories.length} ${selectedCategories.length === 1 ? t('common.category', 'category') : t('common.categories', 'categories')} ${t('common.selected', 'selected')}`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Content */}
                {categoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {categories.map(category => {
                      const isSelected = selectedCategories.includes(category.name);
                      return (
                        <button
                          key={category.name}
                          onClick={() => handleCategoryToggle(category.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 text-sm ${
                            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <CategoryDisplay category={category} size="xs" />
                            <span>{t(`categoryNames.${category.name}`, category.name)}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected Categories Pills */}
                {selectedCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedCategories.map(categoryName => {
                      const categoryObj = categories.find(c => c.name === categoryName);
                      if (!categoryObj) return null;

                      return (
                        <div
                          key={categoryName}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          <CategoryDisplay category={categoryObj} size="xs" />
                          <span>{t(`categoryNames.${categoryName}`, categoryName)}</span>
                          <button
                            onClick={() => handleCategoryToggle(categoryName)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactFiltersBarInternal;
