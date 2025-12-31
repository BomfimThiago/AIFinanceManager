import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName = '',
  className = '',
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderClass = () => {
    if (error) return 'border-error';
    if (isFocused) return 'border-primary-600';
    return 'border-gray-200 dark:border-gray-700';
  };

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-gray-50 dark:bg-gray-800 border rounded-lg py-3 px-4 text-lg text-gray-900 dark:text-gray-100 ${getBorderClass()} ${className}`}
        placeholderTextColor="#9ca3af"
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && (
        <Text className="text-sm text-error mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
