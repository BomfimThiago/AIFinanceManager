import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

type TextVariant =
  | 'displayLg'
  | 'displayMd'
  | 'displaySm'
  | 'headingLg'
  | 'headingMd'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'amount';

type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'success' | 'error' | 'warning';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<TextVariant, string> = {
  displayLg: 'text-4xl font-bold leading-tight',
  displayMd: 'text-3xl font-bold leading-snug',
  displaySm: 'text-2xl font-semibold leading-snug',
  headingLg: 'text-xl font-semibold leading-normal',
  headingMd: 'text-lg font-semibold leading-normal',
  bodyLg: 'text-lg font-normal leading-relaxed',
  bodyMd: 'text-base font-normal leading-relaxed',
  bodySm: 'text-sm font-normal leading-normal',
  amount: 'text-3xl font-bold leading-tight',
};

const colorClasses: Record<TextColor, string> = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-600 dark:text-gray-400',
  muted: 'text-gray-400 dark:text-gray-500',
  inverse: 'text-white dark:text-gray-900',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
};

export function Text({
  variant = 'bodyMd',
  color = 'primary',
  className = '',
  children,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </RNText>
  );
}
