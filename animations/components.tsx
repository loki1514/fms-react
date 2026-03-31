// animations/components.tsx - Reusable animated components
import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { MotiView, MotiText, MotiImage } from 'moti';
import { transitions, entrances } from './presets';

interface AnimatedViewProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  index?: number;
  entrance?: keyof typeof entrances;
}

// Animated container with entrance animation
export function AnimatedView({ 
  children, 
  delay = 0, 
  index = 0, 
  entrance = 'fadeUp',
  style,
  ...props 
}: AnimatedViewProps) {
  const entranceAnim = entrances[entrance];
  
  return (
    <MotiView
      from={entranceAnim.from}
      animate={entranceAnim.animate}
      transition={transitions.stagger(index, delay)}
      style={style}
      {...props}
    >
      {children}
    </MotiView>
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
  index = 0,
  style,
  ...props 
}: AnimatedCardProps) {
  if (onPress) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={transitions.stagger(index, delay)}
        style={style}
      >
        <Pressable onPress={onPress}>
          {({ pressed }) => (
            <MotiView
              animate={{ scale: pressed ? scale : 1 }}
              transition={transitions.quick}
              {...props}
            >
              {children}
            </MotiView>
          )}
        </Pressable>
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={transitions.stagger(index, delay)}
      style={style}
      {...props}
    >
      {children}
    </MotiView>
  );
}

// Animated button with spring feedback
interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

export function AnimatedButton({ children, onPress, disabled }: AnimatedButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <MotiView
          animate={{ 
            scale: pressed ? 0.95 : 1,
            opacity: disabled ? 0.6 : 1,
          }}
          transition={transitions.bouncy}
        >
          {children}
        </MotiView>
      )}
    </Pressable>
  );
}

// Animated list item with stagger
interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
}

export function AnimatedListItem({ children, index, onPress }: AnimatedListItemProps) {
  return (
    <AnimatedCard 
      index={index} 
      delay={40} 
      onPress={onPress}
      scale={0.98}
    >
      {children}
    </AnimatedCard>
  );
}

// Fade in wrapper
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, delay = 0, duration = 400 }: FadeInProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration, delay }}
    >
      {children}
    </MotiView>
  );
}

// Animated stat number
interface AnimatedNumberProps {
  value: number;
  style?: any;
}

export function AnimatedNumber({ value, style }: AnimatedNumberProps) {
  return (
    <MotiText
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitions.spring}
      style={style}
      key={value} // re-animate on change
    >
      {value}
    </MotiText>
  );
}

// Skeleton placeholder
export function SkeletonPulse({ width, height, style }: { width: number; height: number; style?: any }) {
  return (
    <MotiView
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 1000,
        repeat: Infinity,
        repeatReverse: true,
      }}
      style={[{ width, height, backgroundColor: '#E2E8F0', borderRadius: 8 }, style]}
    />
  );
}
