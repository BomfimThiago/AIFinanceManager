# Konta Design System

A comprehensive guide to the visual design system used in the Konta finance management app.

## Table of Contents

- [Overview](#overview)
- [Colors](#colors)
- [Gradients](#gradients)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [Dark Mode](#dark-mode)
- [Usage Examples](#usage-examples)

---

## Overview

Konta uses a modern, vibrant design language centered around purple gradients with pink accents. The design system prioritizes:

- **Accessibility**: High contrast ratios in both light and dark modes
- **Consistency**: Unified color palette and spacing across all screens
- **Delight**: Subtle gradients and decorative elements for visual appeal
- **Platform Adaptability**: Works seamlessly on iOS, Android, and Web

---

## Colors

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#7C3AED` | Main brand color, buttons, links |
| Primary Light | `#A855F7` | Gradient endpoints, hover states |
| Primary Pink | `#EC4899` | Gradient accent, highlights |
| Primary Lighter | `#EDE9FE` | Light mode backgrounds, badges |

### Semantic Colors

| Name | Default | Light Variant | Usage |
|------|---------|---------------|-------|
| Success | `#10B981` | `#D1FAE5` | Completed states, positive amounts |
| Warning | `#F59E0B` | `#FEF3C7` | Processing states, alerts |
| Error | `#EF4444` | `#FEE2E2` | Failed states, destructive actions |
| Info | `#3B82F6` | `#DBEAFE` | Informational elements |

### Category Colors

Each expense category has a unique color for visual distinction:

```typescript
category: {
  groceries: '#10B981',      // Green
  dining: '#EC4899',         // Pink
  transportation: '#3B82F6', // Blue
  entertainment: '#F59E0B',  // Orange
  healthcare: '#EF4444',     // Red
  housing: '#8B5CF6',        // Purple
  education: '#06B6D4',      // Cyan
  other: '#6B7280',          // Gray
}
```

### Using Theme Colors

Import and use the `getThemeColors` function:

```typescript
import { getThemeColors } from '../constants/theme';
import { useColorMode } from '../providers/GluestackUIProvider';

function MyComponent() {
  const { isDark } = useColorMode();
  const colors = getThemeColors(isDark);

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.text }}>Hello</Text>
      <Text style={{ color: colors.textSecondary }}>Secondary text</Text>
    </View>
  );
}
```

### Available Theme Colors

| Property | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `background` | `#FAFBFF` | `#0F0F1A` | Screen backgrounds |
| `surface` | `rgba(255,255,255,0.95)` | `rgba(26,26,46,0.9)` | Cards, modals |
| `surfaceSolid` | `#FFFFFF` | `#1A1A2E` | Solid surface backgrounds |
| `surfaceSecondary` | `#F9FAFB` | `#252547` | Secondary surfaces |
| `text` | `#1A1D29` | `#F9FAFB` | Primary text |
| `textSecondary` | `#6B7280` | `#9CA3AF` | Secondary text |
| `textMuted` | `#9CA3AF` | `#6B7280` | Muted/disabled text |
| `border` | `rgba(124,58,237,0.08)` | `rgba(124,58,237,0.15)` | Subtle borders |
| `borderSolid` | `#E5E7EB` | `#374151` | Solid borders |
| `divider` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` | Divider lines |
| `primary` | `#7C3AED` | `#7C3AED` | Primary brand color |
| `primaryLight` | `#EDE9FE` | `rgba(124,58,237,0.2)` | Primary tint |
| `inputBg` | `rgba(124,58,237,0.05)` | `rgba(255,255,255,0.05)` | Input backgrounds |

---

## Gradients

### Predefined Gradients

```typescript
import { GRADIENTS } from '../constants/theme';

// Available gradients
GRADIENTS.primary      // ['#7C3AED', '#A855F7']
GRADIENTS.primaryFull  // ['#7C3AED', '#A855F7', '#EC4899']
GRADIENTS.success      // ['#10B981', '#059669']
GRADIENTS.info         // ['#3B82F6', '#1D4ED8']
GRADIENTS.warning      // ['#F59E0B', '#D97706']
GRADIENTS.error        // ['#EF4444', '#DC2626']
```

### Using LinearGradient

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../constants/theme';

// Background gradient
<LinearGradient
  colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
  style={styles.container}
/>

// Button gradient
<LinearGradient
  colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
  style={styles.button}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
>
  <Text style={styles.buttonText}>Submit</Text>
</LinearGradient>

// Card gradient (diagonal)
<LinearGradient
  colors={GRADIENTS.primary as [string, string]}
  style={styles.card}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
/>
```

---

## Typography

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | `400` | Body text |
| Medium | `500` | Labels, secondary headings |
| Semibold | `600` | Buttons, badges, emphasis |
| Bold | `700` | Headings, titles |
| Extra Bold | `800` | Large amounts, hero text |

### Font Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| xs | `10-11` | Badges, status indicators |
| sm | `12-13` | Labels, captions, meta text |
| base | `14-15` | Body text, buttons |
| lg | `16-17` | Section titles, card titles |
| xl | `18-20` | Screen subtitles |
| 2xl | `22-26` | Screen titles |
| 3xl | `28-32` | Large headings |
| 4xl | `42` | Hero amounts |

### Text Styles

```typescript
// Primary text
<Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>
  Primary content
</Text>

// Secondary text
<Text style={{ color: colors.textSecondary, fontSize: 13 }}>
  Supporting information
</Text>

// Muted text
<Text style={{ color: colors.textMuted, fontSize: 12 }}>
  Timestamp or hint
</Text>

// Amount display
<Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>
  €1,234.56
</Text>
```

---

## Spacing & Layout

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| sm | `4px` | Small buttons, badges |
| md | `8-10px` | Inputs, small cards |
| lg | `12-14px` | Icons, medium elements |
| xl | `16-20px` | Cards, buttons |
| 2xl | `24px` | Large cards, modals |
| 3xl | `28-32px` | Hero cards, main containers |
| full | `9999px` | Circular elements, pills |

### Padding

| Context | Value | Usage |
|---------|-------|-------|
| Card | `16-20px` | Standard card padding |
| Hero Card | `24-28px` | Balance cards, feature cards |
| Button | `14-18px` vertical | Button internal padding |
| Screen | `16-24px` horizontal | Screen content padding |
| List Item | `16px` | List row padding |

### Shadows

```typescript
// iOS Shadow
shadowIOS: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
}

// Android Shadow
shadowAndroid: {
  elevation: 3,
}

// Web Shadow
shadowWeb: {
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
}

// Usage with Platform
import { Platform } from 'react-native';

<View style={[
  styles.card,
  Platform.OS === 'ios' && styles.shadowIOS,
  Platform.OS === 'android' && styles.shadowAndroid,
  Platform.OS === 'web' && styles.shadowWeb,
]} />
```

---

## Components

### Cards

```typescript
// Standard Card
<View style={[
  styles.card,
  {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  }
]} />

// Gradient Card (Balance, Headers)
<LinearGradient
  colors={GRADIENTS.primaryFull}
  style={styles.gradientCard}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* Decorative circles */}
  <View style={styles.circle1} />
  <View style={styles.circle2} />
  {/* Content */}
</LinearGradient>
```

### Buttons

```typescript
// Primary Button (Gradient)
<Pressable style={styles.buttonWrapper}>
  <LinearGradient
    colors={GRADIENTS.primaryFull}
    style={styles.primaryButton}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
  >
    <Text style={styles.buttonText}>Action</Text>
  </LinearGradient>
</Pressable>

// Secondary Button
<Pressable style={[
  styles.secondaryButton,
  { borderColor: colors.border, backgroundColor: colors.surface }
]}>
  <Text style={{ color: colors.text }}>Secondary</Text>
</Pressable>
```

### Status Badges

```typescript
import { getStatusConfig } from '../constants/theme';

const statusConfig = getStatusConfig(receipt.status, isDark);

<View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
  <Text style={{ color: statusConfig.color }}>{statusConfig.icon}</Text>
  <Text style={{ color: statusConfig.color }}>{statusConfig.label}</Text>
</View>
```

### Input Fields

```typescript
<View style={[
  styles.inputWrapper,
  {
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderWidth: 2,
    borderRadius: 14,
  }
]}>
  <Text style={styles.inputIcon}>✉️</Text>
  <TextInput
    style={[styles.input, { color: colors.text }]}
    placeholderTextColor={colors.textMuted}
    placeholder="Email"
  />
</View>
```

### Category Icons

```typescript
// Category icon with colored background
<View style={[
  styles.categoryIcon,
  { backgroundColor: categoryInfo.color + '20' }  // 20% opacity
]}>
  <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
</View>
```

---

## Dark Mode

### Implementation

Dark mode is managed through the `GluestackUIProvider` context:

```typescript
import { useColorMode } from '../providers/GluestackUIProvider';

function MyComponent() {
  const { isDark, toggleColorMode, setColorMode } = useColorMode();

  return (
    <Pressable onPress={toggleColorMode}>
      <Text>{isDark ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}
```

### Color Adjustments

Dark mode automatically adjusts:
- Backgrounds become deep purple-black (`#0F0F1A`, `#1A1A2E`)
- Surfaces become semi-transparent dark (`rgba(26,26,46,0.9)`)
- Text inverts to light colors
- Borders become more visible with purple tint
- Status colors use lower opacity backgrounds

### Background Gradients

```typescript
// Screen background
<LinearGradient
  colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
  style={styles.container}
/>
```

---

## Usage Examples

### Complete Screen Template

```typescript
import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorMode } from '../providers/GluestackUIProvider';
import { getThemeColors, GRADIENTS } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

export default function ExampleScreen() {
  const { isDark } = useColorMode();
  const colors = getThemeColors(isDark);
  const { horizontalPadding, isDesktop } = useResponsive();

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Card */}
        <LinearGradient
          colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Welcome</Text>
        </LinearGradient>

        {/* Content Card */}
        <View style={[
          styles.contentCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          Platform.OS === 'ios' && styles.shadowIOS,
        ]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Card Title
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Supporting description text here.
          </Text>
        </View>

        {/* Action Button */}
        <Pressable style={styles.buttonWrapper}>
          <LinearGradient
            colors={GRADIENTS.primary as [string, string]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Take Action</Text>
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  contentCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
});
```

### Decorative Elements

```typescript
// Decorative circles for gradient cards
<View style={styles.circle1} />
<View style={styles.circle2} />

// Styles
circle1: {
  position: 'absolute',
  top: -40,
  right: -40,
  width: 150,
  height: 150,
  borderRadius: 75,
  backgroundColor: 'rgba(255,255,255,0.1)',
},
circle2: {
  position: 'absolute',
  bottom: -60,
  left: -30,
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: 'rgba(255,255,255,0.08)',
},

// Background orbs (for auth screens)
orbTop: {
  position: 'absolute',
  top: '5%',
  left: '-10%',
  width: 300,
  height: 300,
  borderRadius: 150,
  overflow: 'hidden',
},
```

---

## File Structure

```
app/src/
├── constants/
│   ├── theme.ts          # Theme colors, gradients, helpers
│   ├── categories.ts     # Category definitions
│   └── config.ts         # App configuration
├── providers/
│   └── GluestackUIProvider.tsx  # Color mode context
├── hooks/
│   └── useResponsive.ts  # Responsive breakpoints
└── components/
    └── ui/               # Reusable UI components
```

---

## Best Practices

1. **Always use theme colors** - Never hardcode colors, always use `getThemeColors(isDark)`

2. **Wrap screens with LinearGradient** - For consistent backgrounds across the app

3. **Use platform-specific shadows** - Check `Platform.OS` for appropriate shadow styles

4. **Test both modes** - Always verify your UI in both light and dark modes

5. **Use semantic color names** - Prefer `colors.success` over `colors.green`

6. **Maintain consistency** - Follow the established border radius and spacing patterns

7. **Consider accessibility** - Ensure sufficient contrast ratios for text

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial design system implementation |
