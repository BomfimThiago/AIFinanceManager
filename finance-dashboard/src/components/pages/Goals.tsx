/**
 * Refactored Goals Component - Pure UI presentation
 * Separates business logic from presentation using hooks
 */

import React from 'react';
import { 
  Plus, Target, Calendar, 
  PiggyBank, CreditCard, DollarSign, Trophy,
  Filter
} from 'lucide-react';

import { useGoalsData } from '../../hooks/useGoalsData';
import { useCategoryTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import type { Goal, Category } from '../../types';

// UI Components
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

// Empty State Component
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg">
    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Yet</h3>
    <p className="text-gray-500 mb-4">Create your first financial goal to start tracking your progress</p>
    <button
      onClick={onCreateClick}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Create Your First Goal
    </button>
  </div>
);

// Summary Cards Component
const SummaryCards: React.FC<{
  calculations: {
    totalGoals: number;
    spendingGoals: number;
    savingGoals: number;
    debtGoals: number;
  };
}> = ({ calculations }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Target className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Goals</p>
          <p className="text-2xl font-bold text-gray-900">{calculations.totalGoals}</p>
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
          <p className="text-2xl font-bold text-gray-900">{calculations.spendingGoals}</p>
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
          <p className="text-2xl font-bold text-gray-900">{calculations.savingGoals}</p>
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
          <p className="text-2xl font-bold text-gray-900">{calculations.debtGoals}</p>
        </div>
      </div>
    </div>
  </div>
);

// Filters Component
const GoalsFilters: React.FC<{
  filterType: string;
  statusFilter: string;
  setFilterType: (type: any) => void;
  setStatusFilter: (status: any) => void;
}> = ({ filterType, statusFilter, setFilterType, setStatusFilter }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border">
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
      </div>
      
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
      >
        <option value="all">All Types</option>
        <option value="spending">Spending Budget</option>
        <option value="saving">Savings Goal</option>
        <option value="debt">Debt Payoff</option>
      </select>
      
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="paused">Paused</option>
      </select>
    </div>
  </div>
);

// Goal Card Component
const GoalCard: React.FC<{
  goal: Goal;
  getGoalIcon: (type: any) => any;
  getTimeHorizonIcon: (horizon: string) => any;
  getStatusColor: (status: any) => string;
  getPriorityColor: (priority: number) => string;
  formatGoalAmount: (amount: number) => string;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  tCategory: (category: string) => string;
}> = ({ 
  goal, 
  getGoalIcon, 
  getTimeHorizonIcon, 
  getStatusColor, 
  getPriorityColor, 
  formatGoalAmount,
  onEdit,
  onDelete,
  tCategory
}) => {
  const { formatShortDate } = useDateFormatter();
  const GoalIcon = getGoalIcon(goal.goal_type);
  const TimeIcon = getTimeHorizonIcon(goal.time_horizon);
  const isOverTarget = goal.current_amount > goal.target_amount;
  const progressPercentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-2 ${getPriorityColor(goal.priority)}`}>
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
            {formatGoalAmount(goal.current_amount)} / {formatGoalAmount(goal.target_amount)}
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
            {formatGoalAmount(goal.remaining_amount)} remaining
          </span>
        </div>
      </div>

      {/* Target Date */}
      {goal.target_date && (
        <div className="mt-4 text-xs text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Target: {formatShortDate(goal.target_date)}
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
          onClick={() => onEdit(goal)}
        >
          Edit
        </button>
        <button 
          className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          onClick={() => onDelete(goal)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Main Goals Component
const Goals: React.FC<GoalsProps> = ({ 
  goals, 
  categories, 
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal, 
  hideAmounts 
}) => {
  void hideAmounts; // Used in child components
  const { tCategory } = useCategoryTranslation(categories);
  
  const {
    modalState,
    filterType,
    statusFilter,
    filteredGoals,
    calculations,
    handleCreateGoalClick,
    handleEditGoal,
    handleDeleteGoal,
    handleCloseModals,
    handleCreateGoal,
    handleUpdateGoal,
    handleConfirmDelete,
    setFilterType,
    setStatusFilter,
    getGoalIcon,
    getTimeHorizonIcon,
    getStatusColor,
    getPriorityColor,
    formatGoalAmount,
    isDeleting,
  } = useGoalsData(goals, categories, onCreateGoal, onUpdateGoal, onDeleteGoal);

  // Pure JSX - only UI rendering
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Goals</h2>
          <p className="text-gray-600 mt-1">Track spending, savings, and debt payoff goals</p>
        </div>
        <button
          onClick={handleCreateGoalClick}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards calculations={calculations} />

      {/* Filters */}
      <GoalsFilters
        filterType={filterType}
        statusFilter={statusFilter}
        setFilterType={setFilterType}
        setStatusFilter={setStatusFilter}
      />

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <EmptyState onCreateClick={handleCreateGoalClick} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              getGoalIcon={getGoalIcon}
              getTimeHorizonIcon={getTimeHorizonIcon}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              formatGoalAmount={formatGoalAmount}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              tCategory={tCategory}
            />
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={modalState.showCreateForm}
        onClose={handleCloseModals}
        onCreateGoal={handleCreateGoal}
        categories={categories}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={modalState.showEditForm}
        onClose={handleCloseModals}
        onUpdateGoal={handleUpdateGoal}
        goal={modalState.selectedGoal}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteGoalModal
        isOpen={modalState.showDeleteConfirm}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        goal={modalState.goalToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Goals;