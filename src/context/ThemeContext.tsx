import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  themes: { id: AppTheme; name: string; description: string; colors: string[] }[];
}

const THEMES: { id: AppTheme; name: string; description: string; colors: string[] }[] = [
  {
    id: 'espresso-terracotta',
    name: 'Warm Espresso & Ochre',
    description: 'Deep espresso noir, terracotta orange, golden ochre, and warm almond linen.',
    colors: ['#1c1210', '#f26a36', '#e5a42f', '#fdf3e5'],
  },
  {
    id: 'forest-rose',
    name: 'Forest Moss & Rose Noir',
    description: 'Deep woodland green, olive moss, dusty rose mauve, and ivory frost.',
    colors: ['#0f1712', '#7da04a', '#d6798c', '#f7f9f6'],
  },
  {
    id: 'obsidian-pure',
    name: 'Obsidian Minimalist',
    description: 'Pitch black #070709, deep titanium slate, razor-sharp monochrome contrast.',
    colors: ['#070709', '#18181f', '#3b82f6', '#f4f4f5'],
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'taskify_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (saved && (saved === 'espresso-terracotta' || saved === 'forest-rose' || saved === 'obsidian-pure')) {
        return saved;
      }
    }
    return 'espresso-terracotta';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
