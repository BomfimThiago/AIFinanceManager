import React, { forwardRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary-600 active:bg-primary-700',
  secondary: 'bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700',
  outline: 'bg-transparent border-2 border-primary-600 active:bg-primary-50 dark:active:bg-primary-900/20',
  danger: 'bg-error active:bg-red-600',
  ghost: 'bg-transparent active:bg-gray-100 dark:active:bg-gray-800',
};

const variantTextClasses = {
  primary: 'text-white',
  secondary: 'text-gray-900 dark:text-gray-100',
  outline: 'text-primary-600',
  danger: 'text-white',
  ghost: 'text-primary-600',
};

const sizeClasses = {
  small: 'py-2 px-4',
  medium: 'py-3 px-6',
  large: 'py-4 px-8',
};

const sizeTextClasses = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
  },
  ref
) {
  const isDisabled = disabled || loading;

  const baseClasses = 'items-center justify-center flex-row rounded-lg';
  const disabledClasses = isDisabled ? 'opacity-50' : '';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? 'white' : '#7c3aed'}
          size="small"
        />
      ) : (
        <Text className={`font-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
});
