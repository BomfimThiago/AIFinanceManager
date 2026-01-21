// src/components/ui/Card.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { radius, getShadow, getTheme } from '../../constants/theme';

type CardVariant = 'default' | 'elevated' | 'glass' | 'gradientBorder';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
}: CardProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  const paddingValues: Record<CardPadding, number> = {
    none: 0,
    sm: 12,
    md: 20,
    lg: 28,
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.surfaceElevated,
          ...getShadow('lg'),
        };
      case 'glass':
        return {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          ...(Platform.OS === 'web' && { backdropFilter: 'blur(20px)' }),
        };
      case 'gradientBorder':
        return {
          backgroundColor: theme.surfaceElevated,
          overflow: 'hidden',
        };
      default:
        return {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          ...getShadow('sm'),
        };
    }
  };

  if (variant === 'gradientBorder') {
    return (
      <View style={[styles.gradientBorderContainer, style]}>
        <LinearGradient
          colors={['#7C3AED', '#A855F7', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
        <View
          style={[
            styles.gradientBorderInner,
            { backgroundColor: theme.surfaceElevated },
            { padding: paddingValues[padding] },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        getVariantStyles(),
        { padding: paddingValues[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Gradient Card for balance/hero sections
interface GradientCardProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
}

export function GradientCard({
  children,
  colors = ['#7C3AED', '#A855F7', '#EC4899'],
  style,
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientCard, getShadow('primary'), style]}
    >
      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />
      {children}
    </LinearGradient>
  );
}

// Stats Card
interface StatsCardProps {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  gradient: string[];
  style?: ViewStyle;
}

export function StatsCard({
  icon,
  label,
  value,
  trend,
  trendUp,
  gradient,
  style,
}: StatsCardProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  return (
    <View
      style={[
        styles.statsCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        getShadow('sm'),
        style,
      ]}
    >
      {/* Background accent */}
      <LinearGradient
        colors={gradient as [string, string]}
        style={styles.statsAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Icon */}
      <LinearGradient
        colors={gradient as [string, string]}
        style={styles.statsIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statsIconInner}>
          <Text style={styles.statsIconText}>{icon}</Text>
        </View>
      </LinearGradient>

      <Text style={[styles.statsLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statsValue, { color: theme.text }]}>{value}</Text>

      {trend && (
        <View
          style={[
            styles.statsTrend,
            { backgroundColor: trendUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' },
          ]}
        >
          <Text
            style={[
              styles.statsTrendText,
              { color: trendUp ? '#10B981' : '#EF4444' },
            ]}
          >
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius['2xl'],
  },
  gradientBorderContainer: {
    borderRadius: radius['2xl'],
    padding: 2,
  },
  gradientBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
  },
  gradientBorderInner: {
    borderRadius: radius['2xl'] - 2,
  },
  gradientCard: {
    borderRadius: radius['3xl'],
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    top: -40,
    right: -40,
    width: 150,
    height: 150,
  },
  decorCircle2: {
    bottom: -60,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statsCard: {
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  statsAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.1,
  },
  statsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsIconInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsIconText: {
    fontSize: 20,
  },
  statsLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsTrend: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statsTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Card;
