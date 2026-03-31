// components/heroui/Badge.tsx - HeroUI Badge component
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography } from '@/theme/theme';

type BadgeVariant = 'flat' | 'bordered' | 'dot';
type BadgeColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children?: React.ReactNode;
  content?: string | number;
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  isInvisible?: boolean;
  shape?: 'rectangle' | 'circle';
  style?: ViewStyle;
  showOutline?: boolean;
}

const colorMap: Record<BadgeColor, string> = {
  default: Colors.textSecondary,
  primary: Colors.primary,
  secondary: Colors.secondary,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.error,
};

export function Badge({
  children,
  content,
  variant = 'flat',
  color = 'primary',
  size = 'md',
  placement = 'top-right',
  isInvisible = false,
  shape = 'rectangle',
  style,
  showOutline = true,
}: BadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colorValue = colorMap[color];

  if (isInvisible) return <>{children}</>;

  const sizeStyles = {
    sm: { minWidth: 16, height: 16, paddingHorizontal: 4 },
    md: { minWidth: 20, height: 20, paddingHorizontal: 6 },
    lg: { minWidth: 24, height: 24, paddingHorizontal: 8 },
  };

  const textSizes = {
    sm: { fontSize: 10, lineHeight: 14 },
    md: { fontSize: 11, lineHeight: 16 },
    lg: { fontSize: 12, lineHeight: 18 },
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'flat':
        return colorValue;
      case 'bordered':
        return 'transparent';
      case 'dot':
        return colorValue;
      default:
        return colorValue;
    }
  };

  const getBorder = () => {
    if (variant === 'bordered') {
      return {
        borderWidth: 1.5,
        borderColor: colorValue,
      };
    }
    if (showOutline) {
      return {
        borderWidth: 2,
        borderColor: isDark ? '#1a1a1a' : '#fff',
      };
    }
    return {};
  };

  const badgeContent = variant === 'dot' ? null : (
    <Text
      style={[
        textSizes[size],
        {
          color: variant === 'bordered' ? colorValue : '#fff',
          fontWeight: '700',
          textAlign: 'center',
        },
      ]}
    >
      {content}
    </Text>
  );

  const badgeElement = (
    <View
      style={[
        styles.badge,
        sizeStyles[size],
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: shape === 'circle' ? sizeStyles[size].height / 2 : Radius.sm,
        },
        getBorder(),
        variant === 'dot' && {
          width: sizeStyles[size].height,
          minWidth: sizeStyles[size].height,
          paddingHorizontal: 0,
        },
        style,
      ]}
    >
      {badgeContent}
    </View>
  );

  if (!children) return badgeElement;

  const placementStyles = {
    'top-right': { top: -4, right: -4 },
    'top-left': { top: -4, left: -4 },
    'bottom-right': { bottom: -4, right: -4 },
    'bottom-left': { bottom: -4, left: -4 },
  };

  return (
    <View style={styles.container}>
      {children}
      <View style={[styles.placement, placementStyles[placement]]}>
        {badgeElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placement: {
    position: 'absolute',
    zIndex: 10,
  },
});

export default Badge;
