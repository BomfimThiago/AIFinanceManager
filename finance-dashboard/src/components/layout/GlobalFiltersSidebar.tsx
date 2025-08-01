import React, { useEffect, useRef, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-custom.css';

import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  X, 
  Calendar as CalendarIcon,
  Sliders,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useCategories } from '../../hooks/queries';
import { convertAPICategoriesList } from '../../utils/categoryMapper';
import CategoryDisplay from '../ui/CategoryDisplay';

type DateRange = [Date | null, Date | null];

interface GlobalFiltersSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
}

const GlobalFiltersSidebar: React.FC<GlobalFiltersSidebarProps> = ({ isVisible, onToggle }) => {
  const { t } = useTranslation();
  const { formatShortDate } = useDateFormatter();
  const { filters, updateFilter, clearFilter, clearFilters, hasActiveFilters } = useGlobalFilters();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategories(true);
  const categories = categoriesData?.categories
    ? convertAPICategoriesList(categoriesData.categories)
    : [];

  // Initialize date range from filters
  useEffect(() => {
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    setDateRange([startDate, endDate]);
  }, [filters.startDate, filters.endDate]);

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

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const handleClearSearch = () => {
    setLocalSearch('');
    updateFilter('search', undefined);
  };

  const handleDateRangeChange = (value: Date | DateRange) => {
    if (Array.isArray(value)) {
      setDateRange(value);
      const [startDate, endDate] = value;
      updateFilter('startDate', startDate ? startDate.toISOString().split('T')[0] : undefined);
      updateFilter('endDate', endDate ? endDate.toISOString().split('T')[0] : undefined);
      setShowDatePicker(false);
    }
  };

  const clearDateRange = () => {
    setDateRange([null, null]);
    updateFilter('startDate', undefined);
    updateFilter('endDate', undefined);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof typeof filters]
  ).length;

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 transform -translate-y-1/2 z-50 bg-white text-gray-700 shadow-lg hover:bg-gray-50 transition-all duration-200 rounded-r-lg px-3 py-4 flex flex-col items-center gap-2 border border-gray-200 ${
          isVisible ? 'left-96' : 'left-0'
        }`}
        title={isVisible ? t('filters.hideFilters') : t('filters.showFilters')}
      >
        {isVisible ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        <Filter className="h-5 w-5" />
        {hasActiveFilters && (
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
            {activeFiltersCount}
          </div>
        )}
      </button>

      {/* Modern Sidebar */}
      <div
        className={`bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 h-full overflow-y-auto flex-shrink-0 transition-all duration-300 shadow-xl ${
          isVisible ? 'w-96' : 'w-0'
        }`}
      >
        <div
          className={`p-6 space-y-6 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        >
          {/* Modern Header */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Sliders className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('filters.title')}</h2>
                  <p className="text-sm text-gray-500">Customize your view</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onToggle}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('filters.hideFilters')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Modern Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">
                Search Transactions
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search descriptions, merchants..."
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
              />
              {localSearch && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {filters.search && (
              <div className="mt-3">
                <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200">
                  <Search className="h-3 w-3 mr-2" />
                  Searching: "{filters.search}"
                  <button
                    onClick={() => clearFilter('search')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modern Date Range Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100" ref={datePickerRef}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-semibold text-gray-900">Date Range</label>
              </div>
              {(dateRange[0] || dateRange[1]) && (
                <button
                  onClick={clearDateRange}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 text-left"
            >
              {dateRange[0] && dateRange[1] ? (
                <span className="text-gray-900 font-medium">
                  {formatShortDate(dateRange[0].toISOString().split('T')[0])} - {formatShortDate(dateRange[1].toISOString().split('T')[0])}
                </span>
              ) : dateRange[0] ? (
                <span className="text-gray-900 font-medium">
                  From {formatShortDate(dateRange[0].toISOString().split('T')[0])}
                </span>
              ) : (
                <span className="text-gray-500">Select date range</span>
              )}
            </button>

            {showDatePicker && (
              <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden calendar-container">
                <Calendar
                  onChange={handleDateRangeChange}
                  value={dateRange}
                  selectRange={true}
                  className="react-calendar-custom"
                />
              </div>
            )}
          </div>

          {/* Modern Category Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Categories</label>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Select multiple categories to show expenses from any of them
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(category => {
                const isSelected = filters.categories?.includes(category.name) || false;
                return (
                  <label key={category.name} className={`flex items-center cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentCategories = filters.categories || [];
                        
                        if (e.target.checked) {
                          // Add category
                          const newCategories = [...currentCategories, category.name];
                          updateFilter('categories', newCategories);
                        } else {
                          // Remove category
                          const newCategories = currentCategories.filter(c => c !== category.name);
                          updateFilter('categories', newCategories.length > 0 ? newCategories : undefined);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mr-3 flex-shrink-0"
                    />
                    <CategoryDisplay 
                      category={category} 
                      variant="compact"
                      className="flex-1"
                      allCategories={categories}
                    />
                  </label>
                );
              })}
            </div>
            {filters.categories && filters.categories.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {filters.categories.length} {filters.categories.length === 1 ? 'category' : 'categories'} selected
                  </span>
                  <button
                    onClick={() => clearFilter('categories')}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {filters.categories.map(categoryName => {
                    const categoryObj = categories.find(c => c.name === categoryName);
                    if (!categoryObj) return null;
                    
                    return (
                      <div key={categoryName} className="inline-flex items-center">
                        <CategoryDisplay
                          category={categoryObj}
                          variant="badge"
                          allCategories={categories}
                        />
                        <button
                          onClick={() => {
                            const newCategories = filters.categories!.filter(c => c !== categoryName);
                            updateFilter('categories', newCategories.length > 0 ? newCategories : undefined);
                          }}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modern Type Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-900">Transaction Type</label>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateFilter('type', undefined)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !filters.type
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => updateFilter('type', 'income')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
                    filters.type === 'income'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>Income</span>
                </button>
                <button
                  onClick={() => updateFilter('type', 'expense')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
                    filters.type === 'expense'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingDown className="h-3 w-3" />
                  <span>Expense</span>
                </button>
              </div>
            </div>
            {filters.type && (
              <div className="mt-3 flex items-center justify-between">
                <div className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg border ${
                  filters.type === 'income'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {filters.type === 'income' ? (
                    <><TrendingUp className="h-3 w-3 mr-2" />Income</>
                  ) : (
                    <><TrendingDown className="h-3 w-3 mr-2" />Expense</>
                  )}
                </div>
                <button
                  onClick={() => clearFilter('type')}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>


          {/* Modern Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Filter className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {activeFiltersCount} Active {activeFiltersCount === 1 ? 'Filter' : 'Filters'}
                    </p>
                    <p className="text-xs text-gray-600">Refining your data view</p>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200"
                >
                  Clear All
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
