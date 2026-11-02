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
    colors: ['#160f0d', '#f26a36', '#e5a42f', '#fdf3e5'],
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost & Platinum',
    description: 'Arctic slate, deep titanium canvas, glacier cyan, and crisp platinum typography.',
    colors: ['#0b0f14', '#38bdf8', '#818cf8', '#f1f5f9'],
  },
  {
    id: 'kyoto-matcha',
    name: 'Kyoto Matcha & Bamboo',
    description: 'Zen moss bamboo, dark evergreen canvas, serene wasabi matcha, and warm cream.',
    colors: ['#0a110c', '#84cc16', '#eab308', '#f7fee7'],
  },
  {
    id: 'amber-dune',
    name: 'Amber Dune & Sahara Gold',
    description: 'Desert dusk, molten liquid gold, sunset copper, and sunlit linen warmth.',
    colors: ['#120e0a', '#f59e0b', '#ea580c', '#fef3c7'],
  },
  {
    id: 'forest-rose',
    name: 'Forest Moss & Rose Noir',
    description: 'Deep woodland green, olive moss, dusty rose mauve, and ivory frost.',
    colors: ['#0c130f', '#7da04a', '#d6798c', '#f7f9f6'],
  },
  {
    id: 'tokyo-neon',
    name: 'Tokyo Cyber Amethyst',
    description: 'Cyber midnight black, radiant electric violet, neon cyan accents, and crisp silver.',
    colors: ['#090a10', '#a855f7', '#06b6d4', '#f8fafc'],
  },
  {
    id: 'obsidian-pure',
    name: 'Obsidian Pure OLED',
    description: 'Pitch black #070709, deep titanium slate, razor-sharp monochrome contrast.',
    colors: ['#070709', '#3b82f6', '#f43f5e', '#f4f4f5'],
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'taskify_theme_preference';

const VALID_THEMES: AppTheme[] = [
  'espresso-terracotta',
  'nordic-frost',
  'kyoto-matcha',
  'amber-dune',
  'forest-rose',
  'tokyo-neon',
  'obsidian-pure',
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (saved && VALID_THEMES.includes(saved)) {
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
