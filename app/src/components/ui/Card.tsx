import React, { forwardRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'elevated' | 'outlined' | 'filled';
  className?: string;
}

const paddingClasses = {
  none: 'p-0',
  small: 'p-3',
  medium: 'p-4',
  large: 'p-6',
};

const variantClasses = {
  elevated: 'bg-white dark:bg-gray-800',
  outlined: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  filled: 'bg-gray-50 dark:bg-gray-900',
};

export const Card = forwardRef<View, CardProps>(function Card(
  { children, padding = 'medium', variant = 'elevated', className = '' },
  ref
) {
  const baseClasses = 'rounded-xl overflow-hidden';

  // Shadows don't work well with NativeWind on native, so we use StyleSheet for elevated cards
  const shadowStyle = variant === 'elevated' ? styles.shadow : undefined;

  return (
    <View
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      style={shadowStyle}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
  }),
});
