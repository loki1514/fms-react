// animations/presets.ts - Premium animation presets for Facility Management
import { MotiTransition } from 'moti';

export const transitions = {
  // Smooth spring for cards and modals
  spring: {
    type: 'spring',
    stiffness: 150,
    damping: 15,
    mass: 1,
  } as MotiTransition,

  // Bouncy spring for buttons
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
    mass: 0.8,
  } as MotiTransition,

  // Gentle fade for backgrounds
  gentle: {
    type: 'timing',
    duration: 400,
    delay: 0,
  } as MotiTransition,

  // Quick response for interactions
  quick: {
    type: 'timing',
    duration: 200,
  } as MotiTransition,

  // Stagger delay calculator
  stagger: (index: number, baseDelay = 50) => ({
    type: 'spring',
    stiffness: 150,
    damping: 15,
    delay: index * baseDelay,
  } as MotiTransition),
};

// Entrance animations
export const entrances = {
  fadeUp: {
    from: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
  },
  fadeIn: {
    from: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
  },
  slideRight: {
    from: { opacity: 0, translateX: -30 },
    animate: { opacity: 1, translateX: 0 },
  },
};

// Interaction animations
export const interactions = {
  press: {
    scale: 0.97,
    opacity: 0.9,
  },
  tap: {
    scale: 0.95,
  },
  hover: {
    scale: 1.02,
    translateY: -2,
  },
};

// Loading skeleton animation
export const skeleton = {
  colors: ['#E2E8F0', '#F1F5F9', '#E2E8F0'],
  transition: {
    duration: 1500,
    repeat: Infinity,
    repeatReverse: true,
  } as MotiTransition,
};
