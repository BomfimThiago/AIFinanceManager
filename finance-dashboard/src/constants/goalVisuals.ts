/**
 * Constants for goal visual identification (colors and icons)
 */

// Goal Colors - A curated selection of vibrant, distinguishable colors
export const GOAL_COLORS = [
  // Primary colors
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange

  // Secondary colors
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F87171', // Rose

  // Tertiary colors
  '#A855F7', // Violet
  '#22D3EE', // Sky
  '#FACC15', // Yellow
  '#FB7185', // Pink-400
  '#34D399', // Emerald
  '#FBBF24', // Amber-400

  // Professional colors
  '#1F2937', // Gray-800
  '#374151', // Gray-700
  '#6B7280', // Gray-500
  '#DC2626', // Red-600
  '#059669', // Green-600
  '#7C2D12', // Amber-800
];

// Goal Icons - Meaningful icons for different types of goals
export const GOAL_ICONS = [
  // Financial goals
  'piggy-bank',
  'dollar-sign',
  'coins',
  'credit-card',
  'wallet',
  'building', // Using building instead of bank

  // Targets & achievements
  'target',
  'trophy',
  'award',
  'star',
  'medal',
  'flag',

  // Growth & progress
  'trending-up',
  'bar-chart', // Will map to BarChart3
  'pie-chart',
  'activity',
  'zap',
  'rocket',

  // Time & planning
  'calendar',
  'clock',
  'timer',

  // Life goals
  'home',
  'car',
  'plane',
  'heart',
  'gift',
  'book',

  // Business & career
  'briefcase',
  'laptop',
  'graduation-cap',
  'chart-line',
  'handshake',

  // Health & lifestyle
  'dumbbell',
  'bike',
  'mountain',
  'coffee',
  'camera',
  'music',
];

// Default goal visuals based on goal type
export const DEFAULT_GOAL_VISUALS = {
  spending: {
    color: '#10B981', // Green (matching the green dollar icon in goal type selection)
    icon: 'dollar-sign',
  },
  saving: {
    color: '#8B5CF6', // Purple (matching the purple piggy bank in goal type selection)
    icon: 'piggy-bank',
  },
  debt: {
    color: '#EF4444', // Red (matching the red credit card in goal type selection)
    icon: 'credit-card',
  },
} as const;

// Get default visual for goal type
export const getDefaultGoalVisual = (goalType: string) => {
  return (
    DEFAULT_GOAL_VISUALS[goalType as keyof typeof DEFAULT_GOAL_VISUALS] || {
      color: GOAL_COLORS[0],
      icon: GOAL_ICONS[0],
    }
  );
};
