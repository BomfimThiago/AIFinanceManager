// src/components/ui/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { radius, getTheme, colors } from '../../constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.danger.main
    : isFocused
    ? colors.primary[600]
    : theme.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(124,58,237,0.05)',
            borderColor,
            borderWidth: 2,
          },
        ]}
      >
        {icon && (
          <Text style={styles.icon}>{icon}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            icon && { paddingLeft: 0 },
            rightIcon && { paddingRight: 0 },
          ]}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />

        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIconContainer}>
            <Text style={styles.icon}>{rightIcon}</Text>
          </Pressable>
        )}
      </View>

      {(error || hint) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.danger.main : theme.textMuted },
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}

// Search Input variant
interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  containerStyle?: ViewStyle;
}

export function SearchInput({ containerStyle, ...props }: SearchInputProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(124,58,237,0.05)',
          borderColor: theme.border,
        },
        containerStyle,
      ]}
    >
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholderTextColor={theme.textMuted}
        placeholder="Buscar..."
        {...props}
      />
    </View>
  );
}

// Toggle/Segmented Control
interface SegmentedControlProps {
  options: { key: string; label: string; icon?: string }[];
  selected: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export function SegmentedControl({
  options,
  selected,
  onChange,
  style,
}: SegmentedControlProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  return (
    <View
      style={[
        styles.segmentedContainer,
        {
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(124,58,237,0.05)',
        },
        style,
      ]}
    >
      {options.map((option) => {
        const isSelected = selected === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[
              styles.segmentedOption,
              isSelected && styles.segmentedOptionActive,
            ]}
          >
            {isSelected ? (
              <View style={styles.segmentedGradient}>
                {option.icon && <Text style={styles.segmentedIcon}>{option.icon}</Text>}
                <Text style={[styles.segmentedText, { color: '#FFFFFF' }]}>
                  {option.label}
                </Text>
              </View>
            ) : (
              <>
                {option.icon && <Text style={styles.segmentedIcon}>{option.icon}</Text>}
                <Text style={[styles.segmentedText, { color: theme.textSecondary }]}>
                  {option.label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
  },
  rightIconContainer: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  // Segmented Control
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
  },
  segmentedOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    gap: 6,
  },
  segmentedOptionActive: {
    backgroundColor: colors.primary[600],
  },
  segmentedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentedIcon: {
    fontSize: 14,
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Input;
