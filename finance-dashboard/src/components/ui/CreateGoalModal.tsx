import React, { useState } from 'react';
import { 
  X, DollarSign, PiggyBank, CreditCard, Calendar, 
  Clock, TrendingUp, Target, AlertCircle 
} from 'lucide-react';

import { useCurrency } from '../../contexts/CurrencyContext';
import { useCategoryTranslation } from '../../contexts/LanguageContext';
import { Category, GoalType, TimeHorizon, GoalRecurrence, GoalCreate } from '../../types';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (goalData: GoalCreate) => void;
  categories: Category[];
}

interface GoalFormData {
  title: string;
  description?: string;
  goal_type: GoalType;
  time_horizon: TimeHorizon;
  recurrence: GoalRecurrence;
  target_amount: string;
  contribution_amount: string;
  category?: string;
  target_date?: string;
  priority: 1 | 2 | 3;
  auto_calculate: boolean;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onCreateGoal,
  categories,
}) => {
  const { sessionCurrency, formatAmount } = useCurrency();
  const { tCategory } = useCategoryTranslation(categories);

  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    goal_type: 'saving', // Default to savings goal (more intuitive)
    time_horizon: 'short',
    recurrence: 'one_time', // Default to one-time for savings
    target_amount: '',
    contribution_amount: '',
    category: '',
    target_date: '',
    priority: 2,
    auto_calculate: false, // Default to manual for savings goals
  });

  const [errors, setErrors] = useState<Partial<GoalFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const goalTypes = [
    {
      value: 'spending' as GoalType,
      label: 'Spending Budget',
      description: 'Set recurring spending limits (e.g., $500/month for food)',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
    },
    {
      value: 'saving' as GoalType,
      label: 'Savings Goal',
      description: 'Save for specific purchases (e.g., car, vacation, emergency fund)',
      icon: PiggyBank,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      value: 'debt' as GoalType,
      label: 'Debt Payoff',
      description: 'Pay off loans or credit cards by a target date',
      icon: CreditCard,
      color: 'text-red-600 bg-red-100',
    },
  ];

  const timeHorizons = [
    {
      value: 'short' as TimeHorizon,
      label: 'Short-term',
      description: '1-6 months',
      icon: Clock,
    },
    {
      value: 'medium' as TimeHorizon,
      label: 'Medium-term',
      description: '6 months - 2 years',
      icon: Calendar,
    },
    {
      value: 'long' as TimeHorizon,
      label: 'Long-term',
      description: '2+ years',
      icon: TrendingUp,
    },
  ];

  const getRecurrenceOptions = () => {
    if (formData.goal_type === 'spending') {
      // Spending goals (budgets) are typically recurring
      return [
        { value: 'weekly' as GoalRecurrence, label: 'Weekly Budget' },
        { value: 'monthly' as GoalRecurrence, label: 'Monthly Budget' },
        { value: 'quarterly' as GoalRecurrence, label: 'Quarterly Budget' },
        { value: 'yearly' as GoalRecurrence, label: 'Yearly Budget' },
      ];
    } else {
      // Savings and debt goals are typically one-time
      return [
        { value: 'one_time' as GoalRecurrence, label: 'One-time Goal' },
        { value: 'monthly' as GoalRecurrence, label: 'Monthly Contributions' },
        { value: 'quarterly' as GoalRecurrence, label: 'Quarterly Contributions' },
        { value: 'yearly' as GoalRecurrence, label: 'Yearly Contributions' },
      ];
    }
  };

  const priorityOptions = [
    { value: 1 as const, label: 'High Priority', color: 'text-red-600' },
    { value: 2 as const, label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 3 as const, label: 'Low Priority', color: 'text-green-600' },
  ];

  const handleInputChange = (field: keyof GoalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-generate title and set defaults based on goal type and category
    if (field === 'goal_type' || field === 'category') {
      const newType = field === 'goal_type' ? value : formData.goal_type;
      const newCategory = field === 'category' ? value : formData.category;
      
      if (newType === 'spending' && newCategory) {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          title: `${newCategory} Budget`,
          recurrence: 'monthly', // Default to monthly for budgets
        }));
      } else if (newType === 'saving') {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          title: prev.title || 'Savings Goal',
          recurrence: 'one_time', // Default to one-time for savings
        }));
      } else if (newType === 'debt') {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          title: prev.title || 'Debt Payoff Goal',
          recurrence: 'one_time', // Default to one-time for debt payoff
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GoalFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      newErrors.target_amount = 'Please enter a valid amount';
    }

    // Validate contribution amount for recurring goals (excluding one_time and spending goals)
    if (formData.goal_type !== 'spending' && formData.recurrence !== 'one_time') {
      if (!formData.contribution_amount || parseFloat(formData.contribution_amount) <= 0) {
        newErrors.contribution_amount = 'Please enter a valid contribution amount';
      }
    }

    if (formData.goal_type === 'spending' && !formData.category) {
      newErrors.category = 'Category is required for spending goals';
    }

    if ((formData.goal_type === 'saving' || formData.goal_type === 'debt') && !formData.target_date) {
      newErrors.target_date = 'Target date is required for savings and debt goals';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const goalData: GoalCreate = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        goal_type: formData.goal_type,
        time_horizon: formData.time_horizon,
        recurrence: formData.recurrence,
        target_amount: parseFloat(formData.target_amount),
        contribution_amount: formData.contribution_amount ? parseFloat(formData.contribution_amount) : undefined,
        category: formData.category || undefined,
        target_date: formData.target_date || undefined,
        priority: formData.priority,
        auto_calculate: formData.auto_calculate,
      };

      await onCreateGoal(goalData);
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        goal_type: 'saving',
        time_horizon: 'short',
        recurrence: 'one_time',
        target_amount: '',
        contribution_amount: '',
        category: '',
        target_date: '',
        priority: 2,
        auto_calculate: false,
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGoalType = goalTypes.find(type => type.value === formData.goal_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Goal</h2>
              <p className="text-gray-600 text-sm mt-1">Set up your financial goal with custom parameters</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Goal Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Goal Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {goalTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('goal_type', type.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.goal_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        <type.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Emergency Fund, Food Budget"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount ({sessionCurrency})
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
                  placeholder="0.00"
                />
                {errors.target_amount && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.target_amount}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
                placeholder="Brief description of your goal..."
              />
            </div>

            {/* Contribution Amount (for recurring savings/debt goals) */}
            {formData.goal_type !== 'spending' && formData.recurrence !== 'one_time' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contribution Amount ({sessionCurrency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.contribution_amount}
                  onChange={(e) => handleInputChange('contribution_amount', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.contribution_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.contribution_amount && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.contribution_amount}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  How much you plan to save/pay per {formData.recurrence.replace('_', ' ')} period
                </p>
              </div>
            )}

            {/* Category (for spending goals) */}
            {formData.goal_type === 'spending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {tCategory(category.name)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>
            )}

            {/* Time Planning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
                <div className="space-y-2">
                  {timeHorizons.map((horizon) => (
                    <button
                      key={horizon.value}
                      type="button"
                      onClick={() => handleInputChange('time_horizon', horizon.value)}
                      className={`w-full p-3 border rounded-lg text-left flex items-center space-x-3 ${
                        formData.time_horizon === horizon.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <horizon.icon className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">{horizon.label}</div>
                        <div className="text-sm text-gray-600">{horizon.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.goal_type === 'spending' ? 'Budget Period' : 'Contribution Schedule'}
                </label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => handleInputChange('recurrence', e.target.value as GoalRecurrence)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {getRecurrenceOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.goal_type === 'spending' 
                    ? 'How often this budget resets'
                    : formData.recurrence === 'one_time' 
                      ? 'Single target to reach (like buying a car)'
                      : 'How often you plan to contribute toward this goal'
                  }
                </p>
              </div>
            </div>

            {/* Target Date (for savings and debt goals) */}
            {(formData.goal_type === 'saving' || formData.goal_type === 'debt') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => handleInputChange('target_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    errors.target_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.target_date && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.target_date}
                  </p>
                )}
              </div>
            )}

            {/* Priority and Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
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
                  id="auto_calculate"
                  checked={formData.auto_calculate}
                  onChange={(e) => handleInputChange('auto_calculate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="auto_calculate" className="text-sm text-gray-700">
                  Auto-calculate progress from expenses
                </label>
              </div>
            </div>

            {/* Preview */}
            {formData.title && formData.target_amount && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Goal Preview</h4>
                <div className="flex items-center space-x-3">
                  {selectedGoalType && (
                    <div className={`p-2 rounded-lg ${selectedGoalType.color}`}>
                      <selectedGoalType.icon className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{formData.title}</div>
                    <div className="text-sm text-gray-600">
                      Target: {formatAmount(parseFloat(formData.target_amount) || 0)}
                      {formData.contribution_amount && formData.goal_type !== 'spending' && formData.recurrence !== 'one_time' && (
                        <> • {formatAmount(parseFloat(formData.contribution_amount) || 0)}/{formData.recurrence.replace('_', ' ')}</>
                      )}
                      {' '} • {formData.time_horizon}-term • {formData.recurrence}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  <span>Create Goal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGoalModal;