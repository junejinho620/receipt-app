import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Theme Palette Types
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceHighlight: string;
  primary: string;
  secondary: string;
  tertiary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  success: string;
  error: string;
  warning: string;
  overlay: string;
  border: string;
  borderActive: string;
};

// --- SAGE THEMES ---
export const sageLightColors: ThemeColors = {
  background: '#F9F9F7',
  surface: '#FFFFFF',
  surfaceHighlight: '#F2E9E4',
  primary: '#70877F',
  secondary: '#4A5D53',
  tertiary: '#E0E0D0',
  textPrimary: '#2F3A33',
  textSecondary: '#5C6B61',
  textTertiary: '#8A9990',
  success: '#70877F',
  error: '#B57F7F',
  warning: '#D4B483',
  overlay: 'rgba(47, 58, 51, 0.4)',
  border: '#E6E6DA',
  borderActive: '#70877F',
};

export const sageDarkColors: ThemeColors = {
  background: '#121413',
  surface: '#1E2320',
  surfaceHighlight: '#2A312D',
  primary: '#8BA99D',
  secondary: '#6E8A7A',
  tertiary: '#4A5D53',
  textPrimary: '#E8EBE9',
  textSecondary: '#A3B0A8',
  textTertiary: '#70877F',
  success: '#8BA99D',
  error: '#D38A8A',
  warning: '#E8CA94',
  overlay: 'rgba(0, 0, 0, 0.7)',
  border: '#2A312D',
  borderActive: '#8BA99D',
};

// --- CYBER-NOIR THEMES ---
export const cyberNoirDarkColors: ThemeColors = {
  background: '#050505',
  surface: '#121212',
  surfaceHighlight: '#1A1A1A',
  primary: '#FF3366',
  secondary: '#00FFCC',
  tertiary: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#666666',
  success: '#00FFCC',
  error: '#FF3366',
  warning: '#FFCC00',
  overlay: 'rgba(0, 0, 0, 0.8)',
  border: '#2A2A2A',
  borderActive: '#FF3366',
};

export const cyberNoirLightColors: ThemeColors = {
  background: '#F0F0F0',
  surface: '#FFFFFF',
  surfaceHighlight: '#E8E8E8',
  primary: '#FF3366',
  secondary: '#00D1A7',
  tertiary: '#CCCCCC',
  textPrimary: '#121212',
  textSecondary: '#666666',
  textTertiary: '#A0A0A0',
  success: '#00D1A7',
  error: '#FF3366',
  warning: '#E6A800',
  overlay: 'rgba(255, 255, 255, 0.7)',
  border: '#D0D0D0',
  borderActive: '#FF3366',
};

// --- DESERT MONOLITH THEMES ---
export const monolithLightColors: ThemeColors = {
  background: '#EAE1D8',
  surface: '#F4ECE4',
  surfaceHighlight: '#D4B8A3',
  primary: '#8B5A2B',
  secondary: '#5C4033',
  tertiary: '#C4A484',
  textPrimary: '#2B1B10',
  textSecondary: '#5C4033',
  textTertiary: '#8B5A2B',
  success: '#8B5A2B',
  error: '#800000',
  warning: '#D2691E',
  overlay: 'rgba(43, 27, 16, 0.4)',
  border: '#D4B8A3',
  borderActive: '#8B5A2B',
};

export const monolithDarkColors: ThemeColors = {
  background: '#1A1410',
  surface: '#241D17',
  surfaceHighlight: '#332921',
  primary: '#C48A5E',
  secondary: '#A17757',
  tertiary: '#5C4033',
  textPrimary: '#EBE2D8',
  textSecondary: '#C4A484',
  textTertiary: '#8B5A2B',
  success: '#C48A5E',
  error: '#C23B3B',
  warning: '#E69C5C',
  overlay: 'rgba(0, 0, 0, 0.7)',
  border: '#332921',
  borderActive: '#C48A5E',
};

export type ThemeName = 'Sage' | 'Cyber-Noir' | 'Monolith';
export type ThemeAppearance = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeName: ThemeName;
  colors: ThemeColors;
  appearance: ThemeAppearance;
  setThemeName: (name: ThemeName) => void;
  setAppearance: (appearance: ThemeAppearance) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('Sage');
  const [appearance, setAppearance] = useState<ThemeAppearance>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    // Load saved preferences
    Promise.all([
      AsyncStorage.getItem('@app_theme'),
      AsyncStorage.getItem('@app_appearance')
    ]).then(([savedTheme, savedAppearance]) => {
      if (savedTheme && ['Sage', 'Cyber-Noir', 'Monolith'].includes(savedTheme)) {
        setThemeName(savedTheme as ThemeName);
      }
      if (savedAppearance && ['light', 'dark', 'system'].includes(savedAppearance)) {
        setAppearance(savedAppearance as ThemeAppearance);
      }
    });

    // Listen to OS system color scheme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const handleSetTheme = (name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem('@app_theme', name);
  };

  const handleSetAppearance = (app: ThemeAppearance) => {
    setAppearance(app);
    AsyncStorage.setItem('@app_appearance', app);
  };

  // Determine effective mode
  const effectiveMode = appearance === 'system' ? (systemColorScheme || 'light') : appearance;
  const isDark = effectiveMode === 'dark';

  // Resolve active colors
  let colors = sageLightColors;
  if (themeName === 'Sage') {
    colors = isDark ? sageDarkColors : sageLightColors;
  } else if (themeName === 'Cyber-Noir') {
    colors = isDark ? cyberNoirDarkColors : cyberNoirLightColors;
  } else if (themeName === 'Monolith') {
    colors = isDark ? monolithDarkColors : monolithLightColors;
  }

  return (
    <ThemeContext.Provider value={{
      themeName,
      appearance,
      colors,
      setThemeName: handleSetTheme,
      setAppearance: handleSetAppearance
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
