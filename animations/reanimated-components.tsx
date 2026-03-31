// animations/reanimated-components.tsx - Reanimated wrapper components
import React, { useEffect } from 'react';
import { Pressable, ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  useEntranceAnimation,
  usePressAnimation,
  useFadeIn,
  useScaleAnimation,
  useStaggeredItem,
  springs,
} from './reanimated-presets';

interface AnimatedViewProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
}

// Animated container with entrance animation
export function AnimatedView({ 
  children, 
  delay = 0,
  fromY = 20,
  style,
  ...props 
}: AnimatedViewProps) {
  const { animatedStyle, startAnimation } = useEntranceAnimation(delay, fromY);

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// Animated card with press feedback
interface AnimatedCardProps extends AnimatedViewProps {
  onPress?: () => void;
  scale?: number;
}

export function AnimatedCard({ 
  children, 
  onPress, 
  scale = 0.97,
  delay = 0,
  style,
  ...props 
}: AnimatedCardProps) {
  const { animatedStyle: entranceStyle, startAnimation } = useEntranceAnimation(delay);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation(scale);

  useEffect(() => {
    startAnimation();
  }, []);

  if (onPress) {
    return (
    <Animated.View style={[entranceStyle, style]} {...props}>
      <Pressable 
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
          <Animated.View style={pressStyle}>
            {children}
          </Animated.View>
      </Pressable>
    </Animated.View>
    );
  }

  return (
    <Animated.View style={[entranceStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

// Animated button with spring feedback
interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}

export function AnimatedButton({ children, onPress, disabled, style }: AnimatedButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.95);

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
    >
      <Animated.View style={[animatedStyle, style, disabled && { opacity: 0.6 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Fade in wrapper
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: any;
}

export function FadeIn({ children, delay = 0, style }: FadeInProps) {
  const { animatedStyle, startAnimation } = useFadeIn(delay);

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// Scale in wrapper
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}

export function ScaleIn({ children, delay = 0, style }: ScaleInProps) {
  const { animatedStyle, startAnimation } = useScaleAnimation(delay);

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// Animated list item with stagger
interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
  style?: any;
}

export function AnimatedListItem({ children, index, onPress, style }: AnimatedListItemProps) {
  const { animatedStyle, startAnimation } = useStaggeredItem(index, 50);

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <Animated.View style={[animatedStyle, style]}>
      {onPress ? (
        <AnimatedCard onPress={onPress} scale={0.98}>
          {children}
        </AnimatedCard>
      ) : (
        children
      )}
    </Animated.View>
  );
}

// Skeleton placeholder
export function SkeletonPulse({ width, height, style }: { width: number; height: number; style?: any }) {
  const { animatedStyle, startAnimation } = useFadeIn(0);

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: '#E2E8F0', borderRadius: 8 },
        animatedStyle,
        style,
      ]}
    />
  );
}
