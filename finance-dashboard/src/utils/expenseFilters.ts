import { GlobalFilters } from '../contexts/GlobalFiltersContext';
import { Expense } from '../types';

/**
 * Filter expenses based on global filters
 */
export const filterExpenses = (expenses: Expense[], filters: GlobalFilters): Expense[] => {
  if (!expenses || expenses.length === 0) return [];

  return expenses.filter(expense => {
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(expense.category)) {
        return false;
      }
    }

    // Type filter (income/expense)
    if (filters.type) {
      const expenseType = expense.amount >= 0 ? 'income' : 'expense';
      if (filters.type !== expenseType) {
        return false;
      }
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      const searchableFields = [
        expense.description || '',
        expense.merchant || '',
        expense.category || '',
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }

    // Date filtering - Priority: Date Range > Month/Year
    const expenseDate = new Date(expense.date);

    // Date range has highest priority
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (expenseDate < startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        // Include the entire end date (set to end of day)
        endDate.setHours(23, 59, 59, 999);
        if (expenseDate > endDate) {
          return false;
        }
      }
    } else {
      // Month filter (if no date range)
      if (filters.month !== undefined) {
        const expenseMonth = expenseDate.getMonth() + 1; // 1-12 (getMonth returns 0-11)
        if (expenseMonth !== filters.month) {
          return false;
        }
      }

      // Year filter (if no date range)
      if (filters.year !== undefined) {
        const expenseYear = expenseDate.getFullYear();
        if (expenseYear !== filters.year) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Get filter summary for display
 */
export const getFilterSummary = (
  filters: GlobalFilters,
  totalExpenses: number,
  filteredExpenses: number
) => {
  const activeFilters = [];

  if (filters.categories && filters.categories.length > 0) {
    activeFilters.push(
      `${filters.categories.length} category${filters.categories.length > 1 ? 'ies' : 'y'}`
    );
  }

  if (filters.type) {
    activeFilters.push(filters.type);
  }

  if (filters.search) {
    activeFilters.push(`search: "${filters.search}"`);
  }

  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) {
      activeFilters.push(`date range`);
    } else if (filters.startDate) {
      activeFilters.push(`from ${filters.startDate}`);
    } else {
      activeFilters.push(`until ${filters.endDate}`);
    }
  } else {
    if (filters.month !== undefined) {
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
      activeFilters.push(monthNames[filters.month - 1]);
    }
    if (filters.year !== undefined) {
      activeFilters.push(`${filters.year}`);
    }
  }

  return {
    hasFilters: activeFilters.length > 0,
    filterCount: activeFilters.length,
    filteredCount: filteredExpenses,
    totalCount: totalExpenses,
    description: activeFilters.join(', '),
  };
};
