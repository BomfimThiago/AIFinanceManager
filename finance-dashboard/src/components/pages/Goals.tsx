import React, { useState } from 'react';
import { 
  Plus, Target, TrendingUp, Calendar, Clock, 
  PiggyBank, CreditCard, DollarSign, Trophy,
  Filter, X
} from 'lucide-react';

import { useCurrency } from '../../contexts/CurrencyContext';
import { useCategoryTranslation } from '../../contexts/LanguageContext';
import { useCategorySpending } from '../../hooks/queries';
import { Category, Goal, GoalType, TimeHorizon, GoalStatus, GoalCreate } from '../../types';
import CreateGoalModal from '../ui/CreateGoalModal';
import EditGoalModal from '../ui/EditGoalModal';
import ConfirmDeleteGoalModal from '../ui/ConfirmDeleteGoalModal';

interface GoalsProps {
  goals: Goal[];
  categories: Category[];
  onCreateGoal: (goalData: any) => void;
  onUpdateGoal: (goalId: number, goalData: any) => void;
  onDeleteGoal: (goalId: number) => void;
  hideAmounts: boolean;
}

type FilterType = 'all' | GoalType;
type StatusFilter = 'all' | GoalStatus;

const Goals: React.FC<GoalsProps> = ({ 
  goals, 
  categories, 
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal, 
  hideAmounts 
}) => {
  const {
    formatAmount: formatCurrencyAmount,
    sessionCurrency,
  } = useCurrency();
  const { tCategory } = useCategoryTranslation(categories);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Get category spending for auto-calculated goals
  const { data: categorySpendingData } = useCategorySpending({ currency: sessionCurrency });
  // Note: categorySpending will be used once we implement auto-calculation
  // const categorySpending = categorySpendingData?.category_spending || {};

  // Filter goals based on selected filters
  const filteredGoals = goals.filter(goal => {
    const typeMatch = filterType === 'all' || goal.goal_type === filterType;
    const statusMatch = statusFilter === 'all' || goal.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Group goals by type for summary
  const goalsByType = {
    spending: goals.filter(g => g.goal_type === 'spending'),
    saving: goals.filter(g => g.goal_type === 'saving'),
    debt: goals.filter(g => g.goal_type === 'debt'),
  };

  const getGoalIcon = (goalType: GoalType) => {
    switch (goalType) {
      case 'spending': return DollarSign;
      case 'saving': return PiggyBank;
      case 'debt': return CreditCard;
      default: return Target;
    }
  };

  const getTimeHorizonIcon = (timeHorizon: TimeHorizon) => {
    switch (timeHorizon) {
      case 'short': return Clock;
      case 'medium': return Calendar;
      case 'long': return TrendingUp;
      default: return Calendar;
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'border-red-200 bg-red-50';
      case 2: return 'border-yellow-200 bg-yellow-50';
      case 3: return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleCreateGoal = (goalData: GoalCreate) => {
    onCreateGoal(goalData);
    setShowCreateForm(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowEditForm(true);
  };

  const handleUpdateGoal = (goalId: number, goalData: any) => {
    onUpdateGoal(goalId, goalData);
    setShowEditForm(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteGoal(goalToDelete.id);
      setShowDeleteConfirm(false);
      setGoalToDelete(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Goals</h2>
          <p className="text-gray-600 mt-1">Track spending, savings, and debt payoff goals</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Spending Goals</p>
              <p className="text-2xl font-bold text-gray-900">{goalsByType.spending.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <PiggyBank className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Savings Goals</p>
              <p className="text-2xl font-bold text-gray-900">{goalsByType.saving.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Debt Goals</p>
              <p className="text-2xl font-bold text-gray-900">{goalsByType.debt.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">All Types</option>
            <option value="spending">Spending Budget</option>
            <option value="saving">Savings Goal</option>
            <option value="debt">Debt Payoff</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-500 mb-4">Create your first financial goal to start tracking your progress</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const GoalIcon = getGoalIcon(goal.goal_type);
            const TimeIcon = getTimeHorizonIcon(goal.time_horizon);
            const isOverTarget = goal.current_amount > goal.target_amount;
            const progressPercentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            
            return (
              <div 
                key={goal.id} 
                className={`bg-white p-6 rounded-xl shadow-sm border-2 ${getPriorityColor(goal.priority)}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      <GoalIcon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{goal.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                          {goal.status}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <TimeIcon className="h-3 w-3 mr-1" />
                          {goal.time_horizon}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {goal.status === 'completed' && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>

                {/* Description */}
                {goal.description && (
                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                )}

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">
                      {hideAmounts ? '***' : formatCurrencyAmount(goal.current_amount)} / {hideAmounts ? '***' : formatCurrencyAmount(goal.target_amount)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        goal.status === 'completed'
                          ? 'bg-green-500'
                          : isOverTarget
                            ? 'bg-red-500'
                            : progressPercentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">
                      {progressPercentage.toFixed(1)}% Complete
                    </span>
                    <span className="font-medium text-gray-600">
                      {hideAmounts ? '***' : formatCurrencyAmount(goal.remaining_amount)} remaining
                    </span>
                  </div>
                </div>

                {/* Target Date */}
                {goal.target_date && (
                  <div className="mt-4 text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Target: {new Date(goal.target_date).toLocaleDateString()}
                  </div>
                )}

                {/* Category for spending goals */}
                {goal.category && (
                  <div className="mt-2 text-xs text-gray-500">
                    Category: {tCategory(goal.category)}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button 
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    onClick={() => handleEditGoal(goal)}
                  >
                    Edit
                  </button>
                  <button 
                    className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    onClick={() => handleDeleteGoal(goal)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreateGoal={handleCreateGoal}
        categories={categories}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedGoal(null);
        }}
        onUpdateGoal={handleUpdateGoal}
        goal={selectedGoal}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteGoalModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setGoalToDelete(null);
        }}
        onConfirm={confirmDeleteGoal}
        goal={goalToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Goals;