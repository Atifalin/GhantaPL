import React, { createContext, useContext } from 'react';

type ThemeColors = {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  error: string;
  success: string;
};

type ThemeContextType = {
  colors: ThemeColors;
};

const defaultColors: ThemeColors = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  border: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors: defaultColors }}>
      {children}
    </ThemeContext.Provider>
  );
} 