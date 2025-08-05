import React, { useEffect, useRef, useState } from 'react';

import {
  Calendar as CalendarIcon,
  ChevronDown,
  DollarSign,
  Search,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useCategories } from '../../hooks/queries';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { convertAPICategoriesList } from '../../utils/categoryMapper';
import CategoryDisplay from '../ui/CategoryDisplay';
import './calendar-custom.css';

type DateRange = [Date | null, Date | null];

interface GlobalFiltersBarProps {
  onClose: () => void;
}

const GlobalFiltersBar: React.FC<GlobalFiltersBarProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { formatShortDate } = useDateFormatter();
  const { filters, updateFilter, clearFilter, clearFilters, hasActiveFilters } = useGlobalFilters();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategories(true);
  const categories = categoriesData?.categories
    ? convertAPICategoriesList(categoriesData.categories)
    : [];

  // Get current month and year for defaults
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear(); // e.g., 2025

  // Initialize month and year with current values if not set
  useEffect(() => {
    if (filters.month === undefined && !filters.startDate && !filters.endDate) {
      updateFilter('month', currentMonth);
    }
    if (filters.year === undefined && !filters.startDate && !filters.endDate) {
      updateFilter('year', currentYear);
    }
  }, []);

  // Initialize date range from filters
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      setDateRange([new Date(filters.startDate), new Date(filters.endDate)]);
    } else if (filters.startDate) {
      setDateRange([new Date(filters.startDate), null]);
    } else if (filters.endDate) {
      setDateRange([null, new Date(filters.endDate)]);
    } else {
      setDateRange([null, null]);
    }
  }, [filters.startDate, filters.endDate]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (localSearch !== (filters.search || '')) {
        if (localSearch.trim()) {
          updateFilter('search', localSearch.trim());
        } else {
          clearFilter('search');
        }
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearch, filters.search, updateFilter, clearFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateChange = (value: any) => {
    if (Array.isArray(value)) {
      const [startDate, endDate] = value as DateRange;
      setDateRange([startDate, endDate]);

      // Date range has preference over month/year
      if (startDate || endDate) {
        clearFilter('month');
        clearFilter('year');
      }

      if (startDate) {
        updateFilter('startDate', startDate.toISOString().split('T')[0]);
      } else {
        clearFilter('startDate');
      }

      if (endDate) {
        updateFilter('endDate', endDate.toISOString().split('T')[0]);
      } else {
        clearFilter('endDate');
      }
    }
  };

  const clearDateFilter = () => {
    setDateRange([null, null]);
    clearFilter('startDate');
    clearFilter('endDate');
    setShowDatePicker(false);
    // Restore month/year defaults if no date range
    updateFilter('month', currentMonth);
    updateFilter('year', currentYear);
  };

  const handleCategoryChange = (categoryName: string) => {
    const currentCategories = filters.categories || [];
    if (currentCategories.includes(categoryName)) {
      const newCategories = currentCategories.filter(cat => cat !== categoryName);
      if (newCategories.length === 0) {
        clearFilter('categories');
      } else {
        updateFilter('categories', newCategories);
      }
    } else {
      updateFilter('categories', [categoryName]);
    }
    setShowCategoryDropdown(false);
  };

  const handleTypeChange = (type: string) => {
    if (filters.type === type) {
      clearFilter('type');
    } else {
      updateFilter('type', type);
    }
    setShowTypeDropdown(false);
  };

  const handleMonthChange = (month: number | '') => {
    if (month === '') {
      clearFilter('month');
    } else {
      updateFilter('month', month);
      // Clear date range when using month filter
      if (filters.startDate || filters.endDate) {
        clearFilter('startDate');
        clearFilter('endDate');
        setDateRange([null, null]);
      }
    }
    setShowMonthDropdown(false);
  };

  const handleYearChange = (year: number | '') => {
    if (year === '') {
      clearFilter('year');
    } else {
      updateFilter('year', year);
      // Clear date range when using year filter
      if (filters.startDate || filters.endDate) {
        clearFilter('startDate');
        clearFilter('endDate');
        setDateRange([null, null]);
      }
    }
    setShowYearDropdown(false);
  };

  const getActiveCategoryName = () => {
    if (!filters.categories || filters.categories.length === 0) return t('filters.allCategories');
    if (filters.categories.length === 1) {
      const category = categories.find(cat => cat.name === filters.categories![0]);
      return category ? category.name : filters.categories[0];
    }
    return `${filters.categories.length} ${t('common.selected', 'selected')}`;
  };

  const getActiveTypeName = () => {
    if (!filters.type) return t('filters.allTypes');
    return filters.type === 'income' ? t('filters.income') : t('filters.expense');
  };

  const getMonthName = (monthNumber: number) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[monthNumber - 1];
  };

  // Generate months array (1-12)
  const generateMonths = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push({ value: i, label: getMonthName(i) });
    }
    return months;
  };

  // Generate years array (last 5 years + current + next 2 years)
  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = -5; i <= 2; i++) {
      const year = currentYear + i;
      years.push(year);
    }
    return years;
  };

  const months = generateMonths();
  const years = generateYears();

  // Check if date range takes precedence
  const hasDateRange = !!(filters.startDate || filters.endDate);

  return (
    <div className="space-y-4">
      {/* Mobile-First Filter Layout */}
      <div className="space-y-3">
        {/* Row 1: Search Input (Full Width on Mobile) */}
        <div className="w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder')}
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category and Type Filters */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {/* Category Filter */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="flex items-center min-w-0">
                <Tag className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{getActiveCategoryName()}</span>
              </div>
              <ChevronDown className="ml-1 w-4 h-4 flex-shrink-0" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-64 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                <button
                  onClick={() => clearFilter('categories')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    !filters.categories || filters.categories.length === 0
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-900'
                  }`}
                >
                  {t('filters.allCategories')}
                </button>
                {categories.map(category => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryChange(category.name)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      filters.categories?.includes(category.name)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-900'
                    }`}
                  >
                    <CategoryDisplay category={category} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="flex items-center min-w-0">
                <DollarSign className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{getActiveTypeName()}</span>
              </div>
              <ChevronDown className="ml-1 w-4 h-4 flex-shrink-0" />
            </button>

            {showTypeDropdown && (
              <div className="absolute z-10 mt-1 w-40 bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <button
                  onClick={() => handleTypeChange('')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    !filters.type ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                  }`}
                >
                  {t('filters.allTypes')}
                </button>
                <button
                  onClick={() => handleTypeChange('income')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                    filters.type === 'income' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  {t('filters.income')}
                </button>
                <button
                  onClick={() => handleTypeChange('expense')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                    filters.type === 'expense' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                  {t('filters.expense')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Date Filters */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {/* Month Filter */}
          <div className="relative" ref={monthDropdownRef}>
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className={`w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                hasDateRange ? 'opacity-50' : ''
              }`}
              disabled={hasDateRange}
            >
              <span className="truncate">
                {hasDateRange
                  ? t('filters.month')
                  : filters.month !== undefined
                    ? getMonthName(filters.month)
                    : t('filters.allMonths')}
              </span>
              <ChevronDown className="ml-1 w-4 h-4 flex-shrink-0" />
            </button>

            {showMonthDropdown && !hasDateRange && (
              <div className="absolute z-10 mt-1 w-48 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                <button
                  onClick={() => handleMonthChange('')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    filters.month === undefined ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                  }`}
                >
                  {t('filters.allMonths')}
                </button>
                {months.map(month => (
                  <button
                    key={month.value}
                    onClick={() => handleMonthChange(month.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      filters.month === month.value
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Filter */}
          <div className="relative" ref={yearDropdownRef}>
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className={`w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                hasDateRange ? 'opacity-50' : ''
              }`}
              disabled={hasDateRange}
            >
              <span className="truncate">
                {hasDateRange
                  ? t('filters.year')
                  : filters.year !== undefined
                    ? filters.year.toString()
                    : t('filters.allYears')}
              </span>
              <ChevronDown className="ml-1 w-4 h-4 flex-shrink-0" />
            </button>

            {showYearDropdown && !hasDateRange && (
              <div className="absolute z-10 mt-1 w-32 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                <button
                  onClick={() => handleYearChange('')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    filters.year === undefined ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                  }`}
                >
                  {t('filters.allYears')}
                </button>
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      filters.year === year ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="relative sm:col-span-1" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="flex items-center min-w-0">
                <CalendarIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {dateRange[0] && dateRange[1]
                    ? `${formatShortDate(dateRange[0])} - ${formatShortDate(dateRange[1])}`
                    : dateRange[0]
                      ? `${t('filters.from')}: ${formatShortDate(dateRange[0])}`
                      : dateRange[1]
                        ? `${t('filters.to')}: ${formatShortDate(dateRange[1])}`
                        : t('filters.dateRange')}
                </span>
              </div>
              <ChevronDown className="ml-1 w-4 h-4 flex-shrink-0" />
            </button>

            {showDatePicker && (
              <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 p-4 right-0 sm:left-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{t('filters.dateRange')}</h3>
                  {(dateRange[0] || dateRange[1]) && (
                    <button
                      onClick={clearDateFilter}
                      className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      {t('common.clear')}
                    </button>
                  )}
                </div>
                <Calendar
                  onChange={handleDateChange}
                  value={dateRange}
                  selectRange={true}
                  className="react-calendar-custom"
                />
              </div>
            )}
          </div>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <div className="flex justify-center">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="w-4 h-4 mr-1" />
              {t('filters.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">{t('dashboard.activeFilters')}:</span>

          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              <Search className="w-3 h-3 mr-1" />
              {t('filters.searching')}: "{filters.search}"
              <button
                onClick={() => clearFilter('search')}
                className="ml-1 text-blue-600 hover:text-blue-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.categories && filters.categories.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
              <Tag className="w-3 h-3 mr-1" />
              {getActiveCategoryName()}
              <button
                onClick={() => clearFilter('categories')}
                className="ml-1 text-purple-600 hover:text-purple-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              {filters.type === 'income' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {getActiveTypeName()}
              <button
                onClick={() => clearFilter('type')}
                className="ml-1 text-green-600 hover:text-green-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.month !== undefined && !hasDateRange && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {getMonthName(filters.month)}
              <button
                onClick={() => clearFilter('month')}
                className="ml-1 text-yellow-600 hover:text-yellow-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.year !== undefined && !hasDateRange && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {filters.year}
              <button
                onClick={() => clearFilter('year')}
                className="ml-1 text-indigo-600 hover:text-indigo-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {filters.startDate && filters.endDate
                ? `${formatShortDate(new Date(filters.startDate))} - ${formatShortDate(new Date(filters.endDate))}`
                : filters.startDate
                  ? `${t('filters.from')}: ${formatShortDate(new Date(filters.startDate))}`
                  : `${t('filters.to')}: ${formatShortDate(new Date(filters.endDate!))}`}
              <button
                onClick={() => {
                  clearFilter('startDate');
                  clearFilter('endDate');
                  setDateRange([null, null]);
                }}
                className="ml-1 text-orange-600 hover:text-orange-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalFiltersBar;
