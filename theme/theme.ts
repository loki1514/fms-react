/**
 * Foundever — Theme System
 * Spacing, radius, shadows, and typography tokens
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 6,
  },
} as const;

export const Typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  headlineLarge: {
    fontSize: 24,
    fontWeight: '500' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
    lineHeight: 28,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  metric: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
} as const;
