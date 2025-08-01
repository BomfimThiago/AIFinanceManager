import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, PiggyBank, CreditCard, Calendar, 
  Clock, TrendingUp, Target, AlertCircle, Save 
} from 'lucide-react';

import { useCurrency } from '../../contexts/CurrencyContext';
import { useCategoryTranslation, useTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { Category, Goal, GoalType, TimeHorizon, GoalRecurrence, GoalStatus, GoalUpdate } from '../../types';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateGoal: (goalId: number, goalData: GoalUpdate) => void;
  goal: Goal | null;
  categories: Category[];
}

interface GoalFormData {
  title: string;
  description?: string;
  target_amount: string;
  current_amount: string;
  target_date?: string;
  priority: 1 | 2 | 3;
  status: GoalStatus;
  auto_calculate: boolean;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  onUpdateGoal,
  goal,
  categories,
}) => {
  const { sessionCurrency, formatAmount } = useCurrency();
  const { tCategory } = useCategoryTranslation(categories);
  const { formatShortDate, formatForInput } = useDateFormatter();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    priority: 2,
    status: 'active',
    auto_calculate: true,
  });

  const [errors, setErrors] = useState<Partial<GoalFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        target_date: goal.target_date || '',
        priority: goal.priority,
        status: goal.status,
        auto_calculate: goal.auto_calculate,
      });
    }
  }, [goal]);

  if (!isOpen || !goal) return null;

  const goalTypes = [
    {
      value: 'spending' as GoalType,
      label: t('goals.spendingBudget'),
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
    },
    {
      value: 'saving' as GoalType,
      label: t('goals.savingsGoal'),
      icon: PiggyBank,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      value: 'debt' as GoalType,
      label: t('goals.debtPayoff'),
      icon: CreditCard,
      color: 'text-red-600 bg-red-100',
    },
  ];

  const timeHorizons = [
    {
      value: 'short' as TimeHorizon,
      label: t('goals.shortTerm'),
      description: t('goals.shortTermDescription'),
      icon: Clock,
    },
    {
      value: 'medium' as TimeHorizon,
      label: t('goals.mediumTerm'),
      description: t('goals.mediumTermDescription'),
      icon: Calendar,
    },
    {
      value: 'long' as TimeHorizon,
      label: t('goals.longTerm'),
      description: t('goals.longTermDescription'),
      icon: TrendingUp,
    },
  ];

  const statusOptions = [
    { value: 'active' as GoalStatus, label: t('goals.active'), color: 'text-green-600' },
    { value: 'completed' as GoalStatus, label: t('goals.completed'), color: 'text-blue-600' },
    { value: 'paused' as GoalStatus, label: t('goals.paused'), color: 'text-yellow-600' },
    { value: 'cancelled' as GoalStatus, label: t('goals.cancelled'), color: 'text-gray-600' },
  ];

  const priorityOptions = [
    { value: 1 as const, label: t('goals.highPriority'), color: 'text-red-600' },
    { value: 2 as const, label: t('goals.mediumPriority'), color: 'text-yellow-600' },
    { value: 3 as const, label: t('goals.lowPriority'), color: 'text-green-600' },
  ];

  const selectedGoalType = goalTypes.find(type => type.value === goal.goal_type);
  const selectedTimeHorizon = timeHorizons.find(horizon => horizon.value === goal.time_horizon);

  const handleInputChange = (field: keyof GoalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GoalFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('goals.titleRequired');
    }

    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      newErrors.target_amount = t('goals.validAmountRequired');
    }

    if (formData.current_amount && parseFloat(formData.current_amount) < 0) {
      newErrors.current_amount = t('goals.currentAmountNegative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const goalData: GoalUpdate = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        target_date: formData.target_date || undefined,
        priority: formData.priority,
        status: formData.status,
        auto_calculate: formData.auto_calculate,
      };

      await onUpdateGoal(goal.id, goalData);
      
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = Math.min(
    (parseFloat(formData.current_amount) || 0) / (parseFloat(formData.target_amount) || 1) * 100, 
    100
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('goals.editGoal')}</h2>
              <p className="text-gray-600 text-sm mt-1">{t('goals.editGoalSubtitle')}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Goal Type Display (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('goals.goalType')}</label>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                {selectedGoalType && (
                  <>
                    <div className={`p-2 rounded-lg ${selectedGoalType.color}`}>
                      <selectedGoalType.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedGoalType.label}</div>
                      <div className="text-sm text-gray-600">
                        {t(`goals.${goal.time_horizon}`)} • {goal.recurrence}
                        {goal.category && ` • ${tCategory(goal.category)}`}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('goals.goalTitle')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as GoalStatus)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('goals.descriptionOptional')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
                placeholder={t('goals.descriptionPlaceholder')}
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('goals.targetAmount')} ({sessionCurrency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.target_amount}
                  onChange={(e) => handleInputChange('target_amount', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.target_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.target_amount && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.target_amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('goals.currentAmount')} ({sessionCurrency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_amount}
                  onChange={(e) => handleInputChange('current_amount', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.current_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={formData.auto_calculate}
                />
                {errors.current_amount && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.current_amount}
                  </p>
                )}
                {formData.auto_calculate && (
                  <p className="text-blue-600 text-sm mt-1">
                    {t('goals.autoCalculatedFromExpenses')}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">{t('goals.progress')}</span>
                <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progressPercentage >= 100
                      ? 'bg-green-500'
                      : progressPercentage > 80
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Target Date */}
            {(goal.goal_type === 'saving' || goal.goal_type === 'debt') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('goals.targetDate')}</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => handleInputChange('target_date', e.target.value)}
                  min={formatForInput(new Date())}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            )}

            {/* Priority and Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('goals.priority')}</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="auto_calculate_edit"
                  checked={formData.auto_calculate}
                  onChange={(e) => handleInputChange('auto_calculate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="auto_calculate_edit" className="text-sm text-gray-700">
                  {t('goals.autoCalculateProgress')}
                </label>
              </div>
            </div>

            {/* Goal Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">{t('goals.goalDetails')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('goals.created')}:</span>
                  <span className="ml-2 font-medium">
                    {formatShortDate(goal.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('goals.lastUpdated')}:</span>
                  <span className="ml-2 font-medium">
                    {formatShortDate(goal.updated_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('goals.remaining')}:</span>
                  <span className="ml-2 font-medium">
                    {formatAmount(Math.max(0, parseFloat(formData.target_amount) - parseFloat(formData.current_amount)))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('goals.startDate')}:</span>
                  <span className="ml-2 font-medium">
                    {formatShortDate(goal.start_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>{t('goals.updating')}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{t('goals.saveChanges')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;