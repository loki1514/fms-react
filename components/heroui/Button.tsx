// components/heroui/Button.tsx - HeroUI Button component
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography } from '@/theme/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs } from '@/animations/reanimated-presets';

type ButtonVariant = 'solid' | 'bordered' | 'light' | 'flat' | 'ghost' | 'shadow';
type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: any;
}

const colorMap: Record<ButtonColor, string> = {
  default: Colors.textSecondary,
  primary: Colors.primary,
  secondary: Colors.secondary,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.error,
};

export function Button({
  children,
  onPress,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const scale = useSharedValue(1);

  const colorValue = colorMap[color];

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#333' : '#e5e5e5';
    switch (variant) {
      case 'solid': return colorValue;
      case 'flat': return `${colorValue}20`;
      case 'light': return 'transparent';
      case 'bordered': return 'transparent';
      case 'ghost': return 'transparent';
      case 'shadow': return colorValue;
      default: return colorValue;
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? '#666' : '#999';
    switch (variant) {
      case 'solid': return '#fff';
      case 'flat': return colorValue;
      case 'light': return colorValue;
      case 'bordered': return colorValue;
      case 'ghost': return colorValue;
      case 'shadow': return '#fff';
      default: return '#fff';
    }
  };

  const getBorder = () => {
    if (variant === 'bordered') {
      return { borderWidth: 1.5, borderColor: colorValue };
    }
    return {};
  };

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12 },
    md: { paddingVertical: 10, paddingHorizontal: 16 },
    lg: { paddingVertical: 14, paddingHorizontal: 24 },
  };

  const textSizes = {
    sm: Typography.labelMedium,
    md: Typography.bodyMedium,
    lg: Typography.titleMedium,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.quick);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.quick);
  };

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          sizeStyles[size],
          {
            backgroundColor: getBackgroundColor(),
            borderRadius: Radius.lg,
            opacity: disabled ? 0.6 : 1,
          },
          getBorder(),
          variant === 'shadow' && styles.shadow,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[
              textSizes[size],
              { color: getTextColor(), fontWeight: '600' },
            ]}>
              {children}
            </Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  shadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default Button;
