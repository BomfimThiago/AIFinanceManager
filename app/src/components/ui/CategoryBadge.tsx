import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getCategoryInfo } from '../../constants/categories';
import { useColorMode } from '../../providers/GluestackUIProvider';

type BadgeSize = 'small' | 'medium' | 'large';

interface CategoryBadgeProps {
  category: string;
  size?: BadgeSize;
  showLabel?: boolean;
  onPress?: () => void;
  className?: string;
}

const sizeConfig = {
  small: { padding: 4, iconSize: 14, fontSize: 12 },
  medium: { padding: 8, iconSize: 16, fontSize: 14 },
  large: { padding: 12, iconSize: 20, fontSize: 16 },
};

export function CategoryBadge({
  category,
  size = 'medium',
  showLabel = true,
  onPress,
  className = '',
}: CategoryBadgeProps) {
  const { isDark } = useColorMode();
  const categoryInfo = getCategoryInfo(category);
  const currentSize = sizeConfig[size];

  // Create a lighter/darker version of the category color for the background
  const backgroundColor = isDark
    ? `${categoryInfo.color}30` // 30 = ~19% opacity
    : `${categoryInfo.color}20`; // 20 = ~12% opacity

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className={`flex-row items-center self-start rounded-full ${className}`}
      style={[
        styles.container,
        {
          backgroundColor,
          paddingVertical: currentSize.padding,
          paddingHorizontal: showLabel ? 12 : currentSize.padding,
        },
      ]}
    >
      <Text style={{ fontSize: currentSize.iconSize }}>{categoryInfo.icon}</Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: categoryInfo.color,
              fontSize: currentSize.fontSize,
              marginLeft: 4,
            },
          ]}
        >
          {categoryInfo.label}
        </Text>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});
