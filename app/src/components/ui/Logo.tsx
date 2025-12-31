import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  /** Size of the logo icon */
  size?: number;
  /** Show text alongside icon */
  showText?: boolean;
  /** Layout direction */
  variant?: 'horizontal' | 'vertical' | 'icon';
  /** Use light version for dark backgrounds */
  light?: boolean;
  /** Custom text color */
  textColor?: string;
}

/**
 * Konta Logo Component
 *
 * A modern, minimal logo featuring a stylized "K" with a coin element
 * representing financial management.
 */
export function Logo({
  size = 40,
  showText = true,
  variant = 'horizontal',
  light = false,
  textColor,
}: LogoProps) {
  const iconSize = size;
  const fontSize = size * 0.7;
  const resolvedTextColor = textColor || (light ? '#ffffff' : '#1f2937');

  // Icon only variant
  if (variant === 'icon' || !showText) {
    return <LogoIcon size={iconSize} />;
  }

  // Vertical layout
  if (variant === 'vertical') {
    return (
      <View style={styles.verticalContainer}>
        <LogoIcon size={iconSize} />
        <Text style={[styles.logoText, { fontSize, color: resolvedTextColor, marginTop: size * 0.2 }]}>
          Konta
        </Text>
      </View>
    );
  }

  // Horizontal layout (default)
  return (
    <View style={styles.horizontalContainer}>
      <LogoIcon size={iconSize} />
      <Text style={[styles.logoText, { fontSize, color: resolvedTextColor, marginLeft: size * 0.3 }]}>
        Konta
      </Text>
    </View>
  );
}

interface LogoIconProps {
  size: number;
}

/**
 * Standalone icon component
 * Features a stylized "K" integrated with a coin/circle element
 */
function LogoIcon({ size }: LogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Primary gradient - Purple theme */}
        <LinearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8b5cf6" />
          <Stop offset="100%" stopColor="#7c3aed" />
        </LinearGradient>
        {/* Accent gradient for coin element */}
        <LinearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#a78bfa" />
          <Stop offset="100%" stopColor="#8b5cf6" />
        </LinearGradient>
      </Defs>

      {/* Background circle - represents a coin */}
      <Circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#primaryGradient)"
      />

      {/* Inner ring of the coin */}
      <Circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
      />

      {/* Stylized "K" letter */}
      {/* Main vertical stroke */}
      <Path
        d="M 35 25 L 35 75"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Upper diagonal stroke */}
      <Path
        d="M 38 50 L 65 28"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lower diagonal stroke */}
      <Path
        d="M 38 50 L 65 72"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Small accent circle - like a coin detail */}
      <Circle
        cx="72"
        cy="28"
        r="6"
        fill="url(#accentGradient)"
        stroke="#ffffff"
        strokeWidth="2"
      />
    </Svg>
  );
}

/**
 * Compact logo for small spaces (tab bar, etc.)
 */
export function LogoCompact({ size = 28 }: { size?: number }) {
  return <LogoIcon size={size} />;
}

/**
 * Logo with tagline for marketing screens
 */
export function LogoWithTagline({
  size = 48,
  light = false,
  textColor,
  tagline = 'Tu asistente financiero',
}: LogoProps & { tagline?: string }) {
  const resolvedTextColor = textColor || (light ? '#ffffff' : '#1f2937');
  const taglineColor = light ? 'rgba(255,255,255,0.7)' : '#6b7280';

  return (
    <View style={styles.taglineContainer}>
      <LogoIcon size={size} />
      <View style={[styles.taglineTextContainer, { marginLeft: size * 0.3 }]}>
        <Text style={[styles.logoText, { fontSize: size * 0.6, color: resolvedTextColor }]}>
          Konta
        </Text>
        <Text style={[styles.taglineText, { fontSize: size * 0.28, color: taglineColor }]}>
          {tagline}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalContainer: {
    alignItems: 'center',
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taglineTextContainer: {
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  taglineText: {
    marginTop: 2,
  },
});

export default Logo;
