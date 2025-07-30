import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useCategories } from '../../hooks/queries';
import { convertAPICategoriesList } from '../../utils/categoryMapper';
import { useTranslation } from '../../contexts/LanguageContext';

interface GlobalFiltersSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
}

const GlobalFiltersSidebar: React.FC<GlobalFiltersSidebarProps> = ({ isVisible, onToggle }) => {
  const { t } = useTranslation();
  const { filters, updateFilter, clearFilter, clearFilters, hasActiveFilters } = useGlobalFilters();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: categoriesData } = useCategories(true);
  const categories = categoriesData?.categories ? convertAPICategoriesList(categoriesData.categories) : [];

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      updateFilter('search', localSearch || undefined);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch, updateFilter]);

  // Sync local search with global search on external changes
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const handleClearSearch = () => {
    setLocalSearch('');
    updateFilter('search', undefined);
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 transform -translate-y-1/2 z-50 bg-white border border-gray-300 shadow-lg hover:bg-gray-50 transition-all duration-300 rounded-r-lg px-2 py-3 flex flex-col items-center gap-1 ${
          isVisible ? 'left-80' : 'left-0'
        }`}
        title={isVisible ? t('filters.hideFilters') : t('filters.showFilters')}
      >
        {isVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Filter className="h-4 w-4 text-gray-600" />
        {hasActiveFilters && (
          <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 h-full overflow-y-auto flex-shrink-0 transition-all duration-300 ${
        isVisible ? 'w-80' : 'w-0'
      }`}>
        <div className={`p-6 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('filters.title')}</h2>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-xs text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                >
                  {t('filters.clearAll')}
                </button>
              )}
              <button
                onClick={onToggle}
                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                title={t('filters.hideFilters')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.searchTransactions')}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={t('filters.searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {localSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {filters.search && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {t('filters.searching').replace('{query}', filters.search)}
                <button
                  onClick={() => clearFilter('search')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.category')}
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('filters.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          {filters.category && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {filters.category}
                <button
                  onClick={() => clearFilter('category')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.transactionType')}
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => updateFilter('type', e.target.value as 'income' | 'expense' | undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('filters.allTypes')}</option>
            <option value="income">{t('filters.income')}</option>
            <option value="expense">{t('filters.expense')}</option>
          </select>
          {filters.type && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                filters.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {filters.type === 'income' ? t('filters.income') : t('filters.expense')}
                <button
                  onClick={() => clearFilter('type')}
                  className={`ml-1 hover:opacity-80 ${
                    filters.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.dateRange')}
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('filters.from')}</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('filters.to')}</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {(filters.startDate || filters.endDate) && (
            <div className="mt-2 space-y-1">
              {filters.startDate && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-1">
                  {t('filters.fromDate').replace('{date}', filters.startDate)}
                  <button
                    onClick={() => clearFilter('startDate')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {t('filters.toDate').replace('{date}', filters.endDate)}
                  <button
                    onClick={() => clearFilter('endDate')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{activeFiltersCount} {activeFiltersCount === 1 ? t('filters.filterActive') : t('filters.filtersActive')}</span>
              <button
                onClick={clearFilters}
                className="text-red-600 hover:text-red-800 font-medium text-xs"
              >
                {t('filters.clearAll')}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default GlobalFiltersSidebar;