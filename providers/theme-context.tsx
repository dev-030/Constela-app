import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: ThemePreference) => void;
  themePreference: ThemePreference;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  const colorScheme = themePreference === 'system' ? systemColorScheme : themePreference;

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme: setThemePreference, themePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
}
