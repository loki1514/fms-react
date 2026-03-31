// components/heroui/Card.tsx - HeroUI Card component
import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Shadows } from '@/theme/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs } from '@/animations/reanimated-presets';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'flat' | 'bordered' | 'shadow';
  isPressable?: boolean;
  fullWidth?: boolean;
}

export function Card({
  children,
  onPress,
  disabled = false,
  style,
  variant = 'flat',
  isPressable = false,
  fullWidth = false,
}: CardProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isPressable || onPress) {
      scale.value = withSpring(0.98, springs.quick);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.quick);
  };

  const getBackgroundColor = () => {
    return isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)';
  };

  const getBorderStyle = () => {
    if (variant === 'bordered') {
      return {
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      };
    }
    return {};
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: Radius['2xl'],
        },
        getBorderStyle(),
        variant === 'shadow' && (isDark ? Shadows.lg : Shadows.glass),
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (isPressable || onPress) {
    return (
      <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => [
            pressed && styles.pressed,
          ]}
        >
          {cardContent}
        </Pressable>
      </Animated.View>
    );
  }

  return cardContent;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardBody({ children, style }: CardBodyProps) {
  return (
    <View style={[styles.body, style]}>
      {children}
    </View>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
  header: {
    marginBottom: Spacing.md,
  },
  body: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default Card;
