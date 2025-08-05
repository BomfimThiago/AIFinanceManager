/**
 * Refactored Goals Component - Pure UI presentation
 * Separates business logic from presentation using hooks
 */
import React from 'react';

import {
  Activity,
  Award,
  BarChart3,
  Bike,
  Book,
  Briefcase,
  Building,
  Calendar,
  Camera,
  Car,
  ChartLine,
  Clock,
  Coffee,
  Coins,
  CreditCard,
  DollarSign,
  Dumbbell,
  Filter,
  Flag,
  Gift,
  GraduationCap,
  Handshake,
  Heart,
  Home,
  Laptop,
  Medal,
  Mountain,
  Music,
  PieChart,
  PiggyBank,
  Plane,
  Plus,
  Rocket,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
} from 'lucide-react';

import { getDefaultGoalVisual } from '../../constants/goalVisuals';
import { useCategoryTranslation, useTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useGoalsData } from '../../hooks/useGoalsData';
import type { Category, Goal } from '../../types';
import ConfirmDeleteGoalModal from '../ui/ConfirmDeleteGoalModal';
// UI Components
import CreateGoalModal from '../ui/CreateGoalModal';
import EditGoalModal from '../ui/EditGoalModal';

// Icon mapping for goal icons
const iconMap: Record<string, React.ElementType> = {
  'piggy-bank': PiggyBank,
  'dollar-sign': DollarSign,
  coins: Coins,
  'credit-card': CreditCard,
  wallet: Wallet,
  building: Building, // Using building instead of bank
  target: Target,
  trophy: Trophy,
  award: Award,
  star: Star,
  medal: Medal,
  flag: Flag,
  'trending-up': TrendingUp,
  'bar-chart': BarChart3, // Using BarChart3 instead of BarChart
  'pie-chart': PieChart,
  activity: Activity,
  zap: Zap,
  rocket: Rocket,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  home: Home,
  car: Car,
  plane: Plane,
  heart: Heart,
  gift: Gift,
  book: Book,
  briefcase: Briefcase,
  laptop: Laptop,
  'graduation-cap': GraduationCap,
  'chart-line': ChartLine,
  handshake: Handshake,
  dumbbell: Dumbbell,
  bike: Bike,
  mountain: Mountain,
  coffee: Coffee,
  camera: Camera,
  music: Music,
};

// Component to render goal icon
const GoalIcon: React.FC<{ iconName: string; className?: string; color?: string }> = ({
  iconName,
  className = 'w-5 h-5',
  color,
}) => {
  const IconComponent = iconMap[iconName] || Target;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};

interface GoalsProps {
  goals: Goal[];
  categories: Category[];
  onCreateGoal: (goalData: any) => void;
  onUpdateGoal: (goalId: number, goalData: any) => void;
  onDeleteGoal: (goalId: number) => void;
  hideAmounts: boolean;
}

// Empty State Component - Responsive
const EmptyState: React.FC<{ onCreateClick: () => void; t: (key: string) => string }> = ({
  onCreateClick,
  t,
}) => (
  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
    <Target className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t('goals.noGoalsYet')}</h3>
    <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4 px-4">
      {t('goals.createFirstGoal')}
    </p>
    <button
      onClick={onCreateClick}
      className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
    >
      {t('goals.createYourFirstGoal')}
    </button>
  </div>
);

// Summary Cards Component - Responsive
const SummaryCards: React.FC<{
  calculations: {
    totalGoals: number;
    spendingGoals: number;
    savingGoals: number;
    debtGoals: number;
  };
  t: (key: string) => string;
}> = ({ calculations, t }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 flex-shrink-0">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-600">{t('goals.totalGoals')}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{calculations.totalGoals}</p>
        </div>
      </div>
    </div>

    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 flex-shrink-0">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-600">{t('goals.spendingGoals')}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">
            {calculations.spendingGoals}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 flex-shrink-0">
          <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-600">{t('goals.savingsGoals')}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{calculations.savingGoals}</p>
        </div>
      </div>
    </div>

    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 flex-shrink-0">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-600">{t('goals.debtGoals')}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{calculations.debtGoals}</p>
        </div>
      </div>
    </div>
  </div>
);

// Filters Component - Responsive
const GoalsFilters: React.FC<{
  filterType: string;
  statusFilter: string;
  setFilterType: (type: any) => void;
  setStatusFilter: (status: any) => void;
  t: (key: string) => string;
}> = ({ filterType, statusFilter, setFilterType, setStatusFilter, t }) => (
  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
    <div className="flex flex-col space-y-3 sm:flex-row sm:flex-wrap sm:gap-4 sm:space-y-0">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-xs sm:text-sm font-medium text-gray-700">{t('goals.filterBy')}</span>
      </div>

      <select
        value={filterType}
        onChange={e => setFilterType(e.target.value)}
        className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">{t('goals.allTypes')}</option>
        <option value="spending">{t('goals.spendingBudget')}</option>
        <option value="saving">{t('goals.savingsGoal')}</option>
        <option value="debt">{t('goals.debtPayoff')}</option>
      </select>

      <select
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
        className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">{t('goals.allStatus')}</option>
        <option value="active">{t('goals.active')}</option>
        <option value="completed">{t('goals.completed')}</option>
        <option value="paused">{t('goals.paused')}</option>
      </select>
    </div>
  </div>
);

// Goal Card Component
const GoalCard: React.FC<{
  goal: Goal;
  getTimeHorizonIcon: (horizon: string) => any;
  getStatusColor: (status: any) => string;
  getPriorityColor: (priority: number) => string;
  formatGoalAmount: (amount: number) => string;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  tCategory: (category: string) => string;
  t: (key: string) => string;
}> = ({
  goal,
  getTimeHorizonIcon,
  getStatusColor,
  getPriorityColor,
  formatGoalAmount,
  onEdit,
  onDelete,
  tCategory,
  t,
}) => {
  const { formatShortDate } = useDateFormatter();
  const TimeIcon = getTimeHorizonIcon(goal.time_horizon);
  const isOverTarget = goal.current_amount > goal.target_amount;
  const progressPercentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

  // Get goal visual properties with fallbacks
  const defaultVisual = getDefaultGoalVisual(goal.goal_type);
  const goalColor = goal.color || defaultVisual.color;
  const goalIcon = goal.icon || defaultVisual.icon;

  // Debug: Log if we're using custom or default colors
  console.log(
    `Goal "${goal.title}": using ${goal.color ? 'custom' : 'default'} color (${goalColor}) and ${goal.icon ? 'custom' : 'default'} icon (${goalIcon})`
  );

  return (
    <div
      className="p-4 sm:p-6 rounded-xl shadow-sm border-2 relative overflow-hidden bg-white"
      style={{
        borderColor: goalColor,
      }}
    >
      {/* Color accent bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: goalColor }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg shadow-sm flex-shrink-0 bg-white">
            <GoalIcon iconName={goalIcon} className="h-4 w-4 sm:h-5 sm:w-5" color={goalColor} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {goal.title}
            </h3>
            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)} self-start`}
              >
                {t(`goals.${goal.status}`)}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <TimeIcon className="h-3 w-3 mr-1" />
                {t(`goals.${goal.time_horizon}`)}
              </span>
            </div>
          </div>
        </div>

        {goal.status === 'completed' && (
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0 ml-2" />
        )}
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{goal.description}</p>
      )}

      {/* Progress */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-500">{t('goals.progress')}</span>
          <span className="font-medium">
            {formatGoalAmount(goal.current_amount)} / {formatGoalAmount(goal.target_amount)}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor:
                goal.status === 'completed'
                  ? '#10B981' // green-500
                  : isOverTarget
                    ? '#EF4444' // red-500
                    : progressPercentage > 80
                      ? '#F59E0B' // yellow-500
                      : goalColor,
            }}
          />
        </div>

        <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:space-y-0 text-xs sm:text-sm">
          <span className="font-medium text-gray-900">
            {progressPercentage.toFixed(1)}% {t('goals.complete')}
          </span>
          <span className="font-medium text-gray-600">
            {formatGoalAmount(goal.remaining_amount)} {t('goals.remaining')}
          </span>
        </div>
      </div>

      {/* Target Date */}
      {goal.target_date && (
        <div className="mt-3 sm:mt-4 text-xs text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {t('goals.target')}: {formatShortDate(goal.target_date)}
        </div>
      )}

      {/* Category for spending goals */}
      {goal.category && (
        <div className="mt-2 text-xs text-gray-500">
          {t('goals.category')}: {tCategory(goal.category)}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 sm:mt-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <button
          className="flex-1 bg-white py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:shadow-md transition-all border"
          style={{
            color: goalColor,
            borderColor: `${goalColor}40`, // 40% opacity border
          }}
          onClick={() => onEdit(goal)}
        >
          {t('goals.edit')}
        </button>
        <button
          className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
          onClick={() => onDelete(goal)}
        >
          {t('goals.delete')}
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
  hideAmounts,
}) => {
  void hideAmounts; // Used in child components
  const { tCategory } = useCategoryTranslation(categories);
  const { t } = useTranslation();

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive like Integrations page */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('goals.title')}</h1>
          <p className="text-gray-600 mt-1">{t('goals.subtitle')}</p>
        </div>
        <button
          onClick={handleCreateGoalClick}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center md:justify-start space-x-2 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4" />
          <span>{t('goals.createGoal')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards calculations={calculations} t={t} />

      {/* Filters */}
      <GoalsFilters
        filterType={filterType}
        statusFilter={statusFilter}
        setFilterType={setFilterType}
        setStatusFilter={setStatusFilter}
        t={t}
      />

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <EmptyState onCreateClick={handleCreateGoalClick} t={t} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              getTimeHorizonIcon={getTimeHorizonIcon}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              formatGoalAmount={formatGoalAmount}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              tCategory={tCategory}
              t={t}
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
