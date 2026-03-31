// animations/reanimated-presets.ts - Reanimated animation presets
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';

// Spring configs
export const springs = {
  smooth: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 400,
    mass: 0.8,
  },
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
};

// Timing configs  
export const timings = {
  quick: 200,
  normal: 300,
  slow: 500,
};

// Entrance animation helper
export function useEntranceAnimation(delay = 0, fromY = 20) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(fromY);

  const startAnimation = () => {
    opacity.value = withDelay(delay, withTiming(1, { duration: timings.normal }));
    translateY.value = withDelay(delay, withSpring(0, springs.smooth));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle, startAnimation, opacity, translateY };
}

// Press animation helper
export function usePressAnimation(scale = 0.97) {
  const scaleValue = useSharedValue(1);

  const onPressIn = () => {
    scaleValue.value = withSpring(scale, springs.bouncy);
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

// Fade in animation
export function useFadeIn(delay = 0) {
  const opacity = useSharedValue(0);

  const startAnimation = () => {
    opacity.value = withDelay(delay, withTiming(1, { duration: timings.normal }));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, startAnimation, opacity };
}

// Scale animation
export function useScaleAnimation(delay = 0) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const startAnimation = () => {
    scale.value = withDelay(delay, withSpring(1, springs.bouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: timings.normal }));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, startAnimation, scale, opacity };
}

// Staggered list animation
export function useStaggeredItem(index: number, baseDelay = 50) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);

  const startAnimation = () => {
    const delay = index * baseDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: timings.normal }));
    translateX.value = withDelay(delay, withSpring(0, springs.smooth));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return { animatedStyle, startAnimation, opacity, translateX };
}

// SLA progress animation
export function useProgressAnimation(progress: number) {
  const width = useSharedValue(0);

  const startAnimation = () => {
    width.value = withSpring(progress * 100, springs.smooth);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return { animatedStyle, startAnimation, width };
}

// Pulse animation for skeletons
export function usePulseAnimation() {
  const opacity = useSharedValue(0.5);

  const startAnimation = () => {
    opacity.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0.5, { duration: 1000 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, startAnimation, opacity };
}
