import React from 'react';

import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  className = '',
}) => {
  // Dynamic styling based on trend
  const getTrendColors = () => {
    switch (trend) {
      case 'positive':
        return {
          textColor: 'text-green-600',
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'negative':
        return {
          textColor: 'text-red-600',
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      default:
        return {
          textColor: 'text-gray-900',
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  const colors = getTrendColors();

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold ${colors.textColor}`}>{value}</p>
        </div>
        <div className={`${colors.bgColor} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
