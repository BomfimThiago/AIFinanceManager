import React, { useState } from 'react';

import {
  Activity,
  AlertCircle,
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
  Rocket,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import { GOAL_COLORS, GOAL_ICONS, getDefaultGoalVisual } from '../../constants/goalVisuals';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useCategoryTranslation, useTranslation } from '../../contexts/LanguageContext';
import { Category, GoalCreate, GoalRecurrence, GoalType, TimeHorizon } from '../../types';

// Icon mapping for goal icons
const iconMap: Record<string, React.ElementType> = {
  'piggy-bank': PiggyBank,
  'dollar-sign': DollarSign,
  coins: Coins,
  'credit-card': CreditCard,
  wallet: Wallet,
  building: Building,
  target: Target,
  trophy: Trophy,
  award: Award,
  star: Star,
  medal: Medal,
  flag: Flag,
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
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

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (goalData: GoalCreate) => void;
  categories: Category[];
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onCreateGoal,
  categories,
}) => {
  const { sessionCurrency, formatAmount } = useCurrency();
  const { tCategory } = useCategoryTranslation(categories);
  const { t } = useTranslation();

  // Step management
  const [currentStep, setCurrentStep] = useState<'type' | 'details' | 'customize'>('type');
  
  // Form data
  const [goalType, setGoalType] = useState<GoalType>('saving');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('medium');
  const [recurrence, setRecurrence] = useState<GoalRecurrence>('one_time');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [autoCalculate, setAutoCalculate] = useState(false);
  
  // Visual customization
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('piggy-bank');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Update defaults when goal type changes
  const handleGoalTypeChange = (newType: GoalType) => {
    setGoalType(newType);
    const defaultVisual = getDefaultGoalVisual(newType);
    setColor(defaultVisual.color);
    setIcon(defaultVisual.icon);
    
    // Set sensible defaults based on type
    if (newType === 'spending') {
      setRecurrence('monthly');
      setAutoCalculate(true);
      setTimeHorizon('short');
    } else if (newType === 'saving') {
      setRecurrence('one_time');
      setAutoCalculate(false);
      setTimeHorizon('medium');
    } else if (newType === 'debt') {
      setRecurrence('one_time');
      setAutoCalculate(false);
      setTimeHorizon('long');
    }
  };

  const goalTypes = [
    {
      value: 'saving' as GoalType,
      title: t('goals.savingsGoal'),
      description: 'Save money for something special',
      example: 'Emergency fund, vacation, new car',
      icon: PiggyBank,
      color: '#8B5CF6',
    },
    {
      value: 'spending' as GoalType,
      title: t('goals.spendingBudget'),
      description: 'Control spending in a category',
      example: 'Food budget, entertainment limit',
      icon: DollarSign,
      color: '#10B981',
    },
    {
      value: 'debt' as GoalType,
      title: t('goals.debtPayoff'),
      description: 'Pay off loans or credit cards',
      example: 'Credit card debt, student loan',
      icon: CreditCard,
      color: '#EF4444',
    },
  ];

  const validateStep = (step: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'details') {
      if (!title.trim()) {
        newErrors.title = t('goals.titleRequired');
      }
      if (!targetAmount || parseFloat(targetAmount) <= 0) {
        newErrors.targetAmount = t('goals.validAmountRequired');
      }
      if (goalType === 'spending' && !category) {
        newErrors.category = t('goals.categoryRequiredForSpending');
      }
      if ((goalType === 'saving' || goalType === 'debt') && !targetDate) {
        newErrors.targetDate = t('goals.targetDateRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 'type') {
      setCurrentStep('details');
    } else if (currentStep === 'details' && validateStep('details')) {
      setCurrentStep('customize');
    }
  };

  const prevStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('type');
    } else if (currentStep === 'customize') {
      setCurrentStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('details')) return;

    setIsSubmitting(true);

    try {
      const goalData: GoalCreate = {
        title: title.trim(),
        description: description?.trim() || undefined,
        goal_type: goalType,
        time_horizon: timeHorizon,
        recurrence,
        target_amount: parseFloat(targetAmount),
        category: goalType === 'spending' ? category : undefined,
        target_date: (goalType === 'saving' || goalType === 'debt') ? targetDate : undefined,
        priority,
        auto_calculate: autoCalculate,
        color,
        icon,
      };

      await onCreateGoal(goalData);
      
      // Reset form
      setCurrentStep('type');
      setGoalType('saving');
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setCategory('');
      setTargetDate('');
      setTimeHorizon('medium');
      setRecurrence('one_time');
      setPriority(2);
      setAutoCalculate(false);
      setColor('#8B5CF6');
      setIcon('piggy-bank');
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGoalType = goalTypes.find(type => type.value === goalType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('goals.createNewGoal')}</h2>
            <div className="flex items-center mt-2">
              {['type', 'details', 'customize'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep === step
                        ? 'bg-blue-600 text-white'
                        : index < ['type', 'details', 'customize'].indexOf(currentStep)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        index < ['type', 'details', 'customize'].indexOf(currentStep)
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Goal Type Selection */}
          {currentStep === 'type' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">What type of goal do you want to create?</h3>
                <p className="text-gray-600">Choose the type that best fits what you want to achieve.</p>
              </div>

              <div className="space-y-4">
                {goalTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleGoalTypeChange(type.value)}
                    className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                      goalType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className="p-3 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: type.color + '20', color: type.color }}
                      >
                        <type.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{type.title}</h4>
                        <p className="text-gray-600 mb-2">{type.description}</p>
                        <p className="text-sm text-gray-500">Examples: {type.example}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goal Details */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tell us about your goal</h3>
                <p className="text-gray-600">Provide the basic details for your {selectedGoalType?.title.toLowerCase()}.</p>
              </div>

              <div className="space-y-4">
                {/* Goal Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={
                      goalType === 'saving' ? 'e.g., Emergency Fund' :
                      goalType === 'spending' ? 'e.g., Food Budget' :
                      'e.g., Credit Card Payoff'
                    }
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {goalType === 'spending' ? 'Budget Limit' : 'Target Amount'} * ({sessionCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      errors.targetAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.targetAmount && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.targetAmount}
                    </p>
                  )}
                </div>

                {/* Category (for spending goals) */}
                {goalType === 'spending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        errors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.name} value={cat.name}>
                          {tCategory(cat.name)}
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

                {/* Target Date (for saving and debt goals) */}
                {(goalType === 'saving' || goalType === 'debt') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Date *
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        errors.targetDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.targetDate && (
                      <p className="text-red-600 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.targetDate}
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Add any additional details about your goal..."
                  />
                </div>

                {/* Time Horizon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Frame
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'short' as TimeHorizon, label: 'Short-term', desc: '1-6 months' },
                      { value: 'medium' as TimeHorizon, label: 'Medium-term', desc: '6 months - 2 years' },
                      { value: 'long' as TimeHorizon, label: 'Long-term', desc: '2+ years' },
                    ].map(horizon => (
                      <button
                        key={horizon.value}
                        type="button"
                        onClick={() => setTimeHorizon(horizon.value)}
                        className={`p-3 border rounded-lg text-center ${
                          timeHorizon === horizon.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{horizon.label}</div>
                        <div className="text-xs text-gray-500">{horizon.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(parseInt(e.target.value) as 1 | 2 | 3)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value={1}>High Priority</option>
                    <option value={2}>Medium Priority</option>
                    <option value={3}>Low Priority</option>
                  </select>
                </div>

                {/* Auto Calculate */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="auto_calculate"
                    checked={autoCalculate}
                    onChange={e => setAutoCalculate(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="auto_calculate" className="text-sm text-gray-700">
                    Automatically track progress from expenses
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customize Appearance */}
          {currentStep === 'customize' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customize your goal</h3>
                <p className="text-gray-600">Choose colors and icons to make your goal stand out.</p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                <div
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: `${color}15`,
                    borderColor: color,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-2 rounded-lg shadow-sm bg-white"
                      style={{ borderColor: color }}
                    >
                      <GoalIcon iconName={icon} className="w-5 h-5" color={color} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{title || 'Your Goal Name'}</div>
                      <div className="text-sm text-gray-600">
                        Target: {formatAmount(parseFloat(targetAmount) || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Color</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                  {GOAL_COLORS.map(colorOption => (
                    <button
                      key={colorOption}
                      type="button"
                      onClick={() => setColor(colorOption)}
                      className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                        color === colorOption
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption }}
                      aria-label={`Select color ${colorOption}`}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Icon</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {GOAL_ICONS.map(iconName => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`p-2 rounded-lg border transition-all hover:bg-gray-50 ${
                        icon === iconName
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      aria-label={`Select icon ${iconName}`}
                    >
                      <GoalIcon iconName={iconName} className="w-5 h-5 text-gray-700" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <div>
            {currentStep !== 'type' && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            {currentStep === 'customize' ? (
              <button
                type="button"
                onClick={handleSubmit}
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
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGoalModal;