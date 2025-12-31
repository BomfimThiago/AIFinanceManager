import React from 'react';
import { View, Text } from 'react-native';

type AmountType = 'expense' | 'income' | 'neutral';
type AmountSize = 'small' | 'medium' | 'large';

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  type?: AmountType;
  size?: AmountSize;
  showSign?: boolean;
  className?: string;
}

const sizeClasses = {
  small: 'text-base',
  medium: 'text-xl font-semibold',
  large: 'text-3xl font-bold',
};

const typeClasses = {
  expense: 'text-error',
  income: 'text-success',
  neutral: 'text-gray-900 dark:text-gray-100',
};

export function AmountDisplay({
  amount,
  currency = 'USD',
  type = 'neutral',
  size = 'medium',
  showSign = false,
  className = '',
}: AmountDisplayProps) {
  const formatAmount = (value: number, curr: string): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(Math.abs(value));
  };

  const getSign = (): string => {
    if (!showSign) return '';
    if (type === 'expense' || amount < 0) return '- ';
    if (type === 'income' || amount > 0) return '+ ';
    return '';
  };

  return (
    <View className={`flex-row items-baseline ${className}`}>
      <Text className={`${sizeClasses[size]} ${typeClasses[type]}`}>
        {getSign()}{formatAmount(amount, currency)}
      </Text>
    </View>
  );
}
