// src/components/ui/Button.tsx
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { colors, radius, getShadow, getTheme } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
}: ButtonProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  const sizeStyles: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number }> = {
    small: { paddingV: 10, paddingH: 16, fontSize: 13 },
    medium: { paddingV: 14, paddingH: 24, fontSize: 15 },
    large: { paddingV: 18, paddingH: 32, fontSize: 16 },
  };

  const { paddingV, paddingH, fontSize } = sizeStyles[size];

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; gradient?: string[] } => {
    switch (variant) {
      case 'primary':
        return {
          container: {},
          text: { color: '#FFFFFF', fontWeight: '700' },
          gradient: ['#7C3AED', '#A855F7', '#EC4899'],
        };
      case 'secondary':
        return {
          container: {},
          text: { color: '#FFFFFF', fontWeight: '600' },
          gradient: ['#06B6D4', '#3B82F6'],
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: theme.primary,
          },
          text: { color: theme.primary, fontWeight: '600' },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: theme.primaryLight,
          },
          text: { color: theme.primary, fontWeight: '600' },
        };
      case 'danger':
        return {
          container: {},
          text: { color: '#FFFFFF', fontWeight: '700' },
          gradient: ['#EF4444', '#DC2626'],
        };
      default:
        return {
          container: {},
          text: { color: '#FFFFFF', fontWeight: '600' },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isGradient = !!variantStyles.gradient;
  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              { fontSize },
              variantStyles.text,
              icon && iconPosition === 'left' && { marginLeft: 8 },
              icon && iconPosition === 'right' && { marginRight: 8 },
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  const containerStyle: ViewStyle = {
    paddingVertical: paddingV,
    paddingHorizontal: paddingH,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
    ...variantStyles.container,
  };

  if (isGradient) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <LinearGradient
          colors={variantStyles.gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            containerStyle,
            getShadow(variant === 'primary' ? 'primary' : 'md'),
          ]}
        >
          {buttonContent}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === 'ghost' && getShadow('sm'),
        style,
      ]}
    >
      {buttonContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});

export default Button;
