/**
 * HeroUI - Theme Context
 * Provides theme state and utilities for HeroUI components
 * Uses existing Colors from the app's theme system
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../../theme/colors';

export type ThemeMode = 'light' | 'dark';

interface HeroUIThemeContextType {
  mode: ThemeMode;
  colors: typeof Colors.light | typeof Colors.dark;
  brand: typeof Colors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const HeroUIThemeContext = createContext<HeroUIThemeContextType | undefined>(undefined);

export const useHeroUI = () => {
  const context = useContext(HeroUIThemeContext);
  if (!context) {
    throw new Error('useHeroUI must be used within a HeroUIProvider');
  }
  return context;
};

interface HeroUIProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  forcedMode?: ThemeMode;
}

export const HeroUIProvider: React.FC<HeroUIProviderProps> = ({
  children,
  defaultMode,
  forcedMode,
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(
    forcedMode || defaultMode || (systemColorScheme as ThemeMode) || 'light'
  );

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const colors = mode === 'light' ? Colors.light : Colors.dark;

  return (
    <HeroUIThemeContext.Provider
      value={{
        mode,
        colors,
        brand: Colors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </HeroUIThemeContext.Provider>
  );
};
