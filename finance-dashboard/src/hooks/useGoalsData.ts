/**
 * Goals Data Hook - Business logic for goals management
 * Handles CRUD operations, filtering, and calculations
 */

import { useState, useCallback, useMemo } from 'react';
import { DollarSign, PiggyBank, CreditCard, Target, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useCategorySpending } from './queries';
import { useAppNotifications } from './useAppNotifications';
import { useUserPreferences } from './useUserPreferences';
import { getUserFriendlyError } from '../utils/errorMessages';
import type { Goal, GoalType, GoalStatus, Category, GoalCreate } from '../types';

export type FilterType = 'all' | GoalType;
export type StatusFilter = 'all' | GoalStatus;

interface GoalModalState {
  selectedGoal: Goal | null;
  goalToDelete: Goal | null;
  showCreateForm: boolean;
  showEditForm: boolean;
  showDeleteConfirm: boolean;
}

interface GoalCalculations {
  totalGoals: number;
  spendingGoals: number;
  savingGoals: number;
  debtGoals: number;
  activeGoals: number;
  completedGoals: number;
}

interface GoalsDataResult {
  // Modal state
  modalState: GoalModalState;
  
  // Filters
  filterType: FilterType;
  statusFilter: StatusFilter;
  filteredGoals: Goal[];
  
  // Calculations
  calculations: GoalCalculations;
  goalsByType: {
    spending: Goal[];
    saving: Goal[];
    debt: Goal[];
  };
  
  // Actions
  handleCreateGoalClick: () => void;
  handleEditGoal: (goal: Goal) => void;
  handleDeleteGoal: (goal: Goal) => void;
  handleCloseModals: () => void;
  handleCreateGoal: (goalData: GoalCreate) => Promise<void>;
  handleUpdateGoal: (goalId: number, goalData: any) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  setFilterType: (type: FilterType) => void;
  setStatusFilter: (status: StatusFilter) => void;
  
  // Utilities
  getGoalIcon: (goalType: GoalType) => any;
  getTimeHorizonIcon: (timeHorizon: string) => any;
  getStatusColor: (status: GoalStatus) => string;
  getPriorityColor: (priority: number) => string;
  formatGoalAmount: (amount: number) => string;
  
  // Loading states
  isDeleting: boolean;
  categorySpendingData: any;
}

export function useGoalsData(
  goals: Goal[],
  categories: Category[],
  onCreateGoal: (goalData: any) => void,
  onUpdateGoal: (goalId: number, goalData: any) => void,
  onDeleteGoal: (goalId: number) => void
): GoalsDataResult {
  void categories; // Categories used in parent component
  const { currency, hideAmounts } = useUserPreferences();
  const { showSuccess, showError } = useAppNotifications();

  // Modal state
  const [modalState, setModalState] = useState<GoalModalState>({
    selectedGoal: null,
    goalToDelete: null,
    showCreateForm: false,
    showEditForm: false,
    showDeleteConfirm: false,
  });

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  // Get category spending data
  const { data: categorySpendingData } = useCategorySpending({ currency });

  // Modal handlers
  const handleCreateGoalClick = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showCreateForm: true,
    }));
  }, []);

  const handleEditGoal = useCallback((goal: Goal) => {
    setModalState(prev => ({
      ...prev,
      selectedGoal: goal,
      showEditForm: true,
    }));
  }, []);

  const handleDeleteGoal = useCallback((goal: Goal) => {
    setModalState(prev => ({
      ...prev,
      goalToDelete: goal,
      showDeleteConfirm: true,
    }));
  }, []);

  const handleCloseModals = useCallback(() => {
    setModalState({
      selectedGoal: null,
      goalToDelete: null,
      showCreateForm: false,
      showEditForm: false,
      showDeleteConfirm: false,
    });
  }, []);

  // CRUD operations
  const handleCreateGoal = useCallback(async (goalData: GoalCreate) => {
    try {
      await onCreateGoal(goalData);
      showSuccess('Goal created successfully');
      handleCloseModals();
    } catch (error: any) {
      console.error('Create goal error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
  }, [onCreateGoal, showSuccess, showError, handleCloseModals]);

  const handleUpdateGoal = useCallback(async (goalId: number, goalData: any) => {
    try {
      await onUpdateGoal(goalId, goalData);
      showSuccess('Goal updated successfully');
      handleCloseModals();
    } catch (error: any) {
      console.error('Update goal error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
  }, [onUpdateGoal, showSuccess, showError, handleCloseModals]);

  const handleConfirmDelete = useCallback(async () => {
    if (!modalState.goalToDelete) return;

    setIsDeleting(true);
    try {
      await onDeleteGoal(modalState.goalToDelete.id);
      showSuccess('Goal deleted successfully');
      handleCloseModals();
    } catch (error: any) {
      console.error('Delete goal error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    } finally {
      setIsDeleting(false);
    }
  }, [modalState.goalToDelete, onDeleteGoal, showSuccess, showError, handleCloseModals]);

  // Filtering logic
  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const typeMatch = filterType === 'all' || goal.goal_type === filterType;
      const statusMatch = statusFilter === 'all' || goal.status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [goals, filterType, statusFilter]);

  // Group goals by type
  const goalsByType = useMemo(() => ({
    spending: goals.filter(g => g.goal_type === 'spending'),
    saving: goals.filter(g => g.goal_type === 'saving'),
    debt: goals.filter(g => g.goal_type === 'debt'),
  }), [goals]);

  // Calculations
  const calculations = useMemo<GoalCalculations>(() => ({
    totalGoals: goals.length,
    spendingGoals: goalsByType.spending.length,
    savingGoals: goalsByType.saving.length,
    debtGoals: goalsByType.debt.length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
  }), [goals, goalsByType]);

  // Utility functions
  const getGoalIcon = useCallback((goalType: GoalType) => {
    switch (goalType) {
      case 'spending': return DollarSign;
      case 'saving': return PiggyBank;
      case 'debt': return CreditCard;
      default: return Target;
    }
  }, []);

  const getTimeHorizonIcon = useCallback((timeHorizon: string) => {
    switch (timeHorizon) {
      case 'short': return Clock;
      case 'medium': return Calendar;
      case 'long': return TrendingUp;
      default: return Calendar;
    }
  }, []);

  const getStatusColor = useCallback((status: GoalStatus) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const getPriorityColor = useCallback((priority: number) => {
    switch (priority) {
      case 1: return 'border-red-200 bg-red-50';
      case 2: return 'border-yellow-200 bg-yellow-50';
      case 3: return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  }, []);

  const formatGoalAmount = useCallback((amount: number) => {
    if (hideAmounts) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [hideAmounts, currency]);

  return {
    // Modal state
    modalState,
    
    // Filters
    filterType,
    statusFilter,
    filteredGoals,
    
    // Calculations
    calculations,
    goalsByType,
    
    // Actions
    handleCreateGoalClick,
    handleEditGoal,
    handleDeleteGoal,
    handleCloseModals,
    handleCreateGoal,
    handleUpdateGoal,
    handleConfirmDelete,
    setFilterType,
    setStatusFilter,
    
    // Utilities
    getGoalIcon,
    getTimeHorizonIcon,
    getStatusColor,
    getPriorityColor,
    formatGoalAmount,
    
    // Loading states
    isDeleting,
    categorySpendingData,
  };
}