import React, { createContext, useContext, useEffect, useState, useMemo, startTransition } from 'react';
import type { GeneratedPalette } from '../utils/paletteGenerator';

export interface ThemeDefinition {
  id: string;
  name: string;
  category: 'soft' | 'dark' | 'minimalist' | 'custom';
  description: string;
  colors: string[]; // [canvas, primary, secondary, highlight/accent]
  isCustom?: boolean;
  seedColor?: string;
  customConfig?: {
    canvasColor: string;
    primaryColor: string;
    secondaryColor: string;
    cardColor?: string;
    cardHoverColor?: string;
    subtleColor?: string;
    inputColor?: string;
    highlightColor?: string;
    dockColor?: string;
  };
}

export const PRESET_THEMES: ThemeDefinition[] = [
  // 1. Soft & Organic Palettes (Earth, Clay, Pistachio, Matcha, Amber)
  {
    id: 'espresso-terracotta',
    name: 'Espresso & Tangerine',
    category: 'soft',
    description: 'Flagship Palette 341: Warm chocolate espresso, vibrant tangerine terracotta, mustard gold, and warm linen.',
    colors: ['#160f0d', '#f5773f', '#e7a936', '#fef0d8'],
  },
  {
    id: 'pistachio-cream',
    name: 'Pistachio Leaf & Cream',
    category: 'soft',
    description: 'Palette 340: Pistachio leaf green, blush rose, soft ivory cream, and deep moss canvas.',
    colors: ['#131910', '#c6d77b', '#c17685', '#fffff6'],
  },
  {
    id: 'forest-rose',
    name: 'Forest Moss & Dusty Rose',
    category: 'soft',
    description: 'Palette 340: Deep woodland green, olive moss, dusty rose mauve, and ivory frost.',
    colors: ['#0c130f', '#7da04a', '#d6798c', '#f7f9f6'],
  },
  {
    id: 'kyoto-matcha',
    name: 'Kyoto Matcha & Bamboo',
    category: 'soft',
    description: 'Zen moss bamboo, dark evergreen canvas, serene wasabi matcha, and warm cream.',
    colors: ['#0a110c', '#84cc16', '#eab308', '#f7fee7'],
  },
  {
    id: 'amber-dune',
    name: 'Amber Dune & Sahara Gold',
    category: 'soft',
    description: 'Desert dusk, molten liquid gold, sunset copper, and sunlit linen warmth.',
    colors: ['#120e0a', '#f59e0b', '#ea580c', '#fef3c7'],
  },

  // 2. Dark & OLED Palettes (True blacks, Cyber violet, Velvet wine)
  {
    id: 'obsidian-pure',
    name: 'Obsidian Pure OLED',
    category: 'dark',
    description: 'Pitch black #070709, deep titanium slate, razor-sharp monochrome contrast.',
    colors: ['#070709', '#3b82f6', '#f43f5e', '#f4f4f5'],
  },
  {
    id: 'velvet-burgundy',
    name: 'Velvet Wine & Dusty Rose',
    category: 'dark',
    description: 'Palette 340: Deep mahogany wine noir, dusty rose, delicate blush pink, and pure ivory light.',
    colors: ['#12080a', '#c17685', '#f2cece', '#fffff6'],
  },
  {
    id: 'tokyo-neon',
    name: 'Tokyo Cyber Amethyst',
    category: 'dark',
    description: 'Cyber midnight black, radiant electric violet, neon cyan accents, and crisp silver.',
    colors: ['#090a10', '#a855f7', '#06b6d4', '#f8fafc'],
  },

  // 3. Minimalist & Studio Palettes (Titanium, Slate, Clean Monochrome)
  {
    id: 'nordic-frost',
    name: 'Nordic Frost & Platinum',
    category: 'minimalist',
    description: 'Arctic slate, deep titanium canvas, glacier cyan, and crisp platinum typography.',
    colors: ['#0b0f14', '#38bdf8', '#818cf8', '#f1f5f9'],
  },
];

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  themes: ThemeDefinition[];
  presetThemes: ThemeDefinition[];
  customThemes: ThemeDefinition[];
  addCustomTheme: (name: string, canvasColor: string, primaryColor: string, secondaryColor: string) => void;
  addHarmonicTheme: (palette: GeneratedPalette) => void;
  deleteCustomTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const PREFERENCE_STORAGE_KEY = 'taskify_theme_preference';
const CUSTOM_THEMES_STORAGE_KEY = 'taskify_custom_themes';

function adjustHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Load custom themes from storage
  const [customThemes, setCustomThemes] = useState<ThemeDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // 2. Active theme id
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PREFERENCE_STORAGE_KEY);
      if (saved) return saved;
    }
    return 'espresso-terracotta';
  });

  // All combined themes
  const allThemes = useMemo(() => [...PRESET_THEMES, ...customThemes], [customThemes]);

  // Apply CSS variables to DOM
  const applyThemeToDOM = (themeId: string, themesList: ThemeDefinition[]) => {
    if (typeof document === 'undefined') return;

    const target = themesList.find((t) => t.id === themeId);
    const root = document.documentElement;

    if (target && target.isCustom && target.customConfig) {
      // Custom theme: apply dynamic inline styles
      const cfg = target.customConfig;
      const cardColor = cfg.cardColor || adjustHex(cfg.canvasColor, 14);
      const cardHoverColor = cfg.cardHoverColor || adjustHex(cfg.canvasColor, 22);
      const subtleColor = cfg.subtleColor || adjustHex(cfg.canvasColor, 8);
      const inputColor = cfg.inputColor || adjustHex(cfg.canvasColor, -4);
      const dockColor = cfg.dockColor || adjustHex(cfg.canvasColor, 12);
      const highlight = cfg.highlightColor || '#ffffff';

      root.setAttribute('data-theme', 'custom');
      root.style.setProperty('--bg-canvas', cfg.canvasColor);
      root.style.setProperty('--bg-card', cardColor);
      root.style.setProperty('--bg-card-hover', cardHoverColor);
      root.style.setProperty('--bg-subtle', subtleColor);
      root.style.setProperty('--bg-input', inputColor);
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-card', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--border-focus', `${cfg.primaryColor}80`);
      root.style.setProperty('--accent-primary', cfg.primaryColor);
      root.style.setProperty('--accent-primary-hover', adjustHex(cfg.primaryColor, 20));
      root.style.setProperty('--accent-secondary', cfg.secondaryColor);
      root.style.setProperty('--accent-secondary-hover', adjustHex(cfg.secondaryColor, 20));
      root.style.setProperty('--accent-success', '#10b981');
      root.style.setProperty('--accent-highlight', highlight);
      root.style.setProperty('--text-primary', highlight);
      root.style.setProperty('--text-secondary', '#a1a1aa');
      root.style.setProperty('--text-muted', '#71717a');
      root.style.setProperty('--dock-bg', dockColor);
      root.style.setProperty('--dock-border', `${cfg.primaryColor}35`);
    } else {
      // Preset theme: clear custom inline styles so [data-theme="..."] rules apply cleanly
      root.style.removeProperty('--bg-canvas');
      root.style.removeProperty('--bg-card');
      root.style.removeProperty('--bg-card-hover');
      root.style.removeProperty('--bg-subtle');
      root.style.removeProperty('--bg-input');
      root.style.removeProperty('--border-subtle');
      root.style.removeProperty('--border-card');
      root.style.removeProperty('--border-focus');
      root.style.removeProperty('--accent-primary');
      root.style.removeProperty('--accent-primary-hover');
      root.style.removeProperty('--accent-secondary');
      root.style.removeProperty('--accent-secondary-hover');
      root.style.removeProperty('--accent-success');
      root.style.removeProperty('--accent-highlight');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-secondary');
      root.style.removeProperty('--text-muted');
      root.style.removeProperty('--dock-bg');
      root.style.removeProperty('--dock-border');

      root.setAttribute('data-theme', themeId);
    }
  };

  const setTheme = (newTheme: string) => {
    const apply = () => {
      startTransition(() => {
        setThemeState(newTheme);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERENCE_STORAGE_KEY, newTheme);
      }
      applyThemeToDOM(newTheme, allThemes);
    };

    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      try {
        (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(apply);
      } catch {
        apply();
      }
    } else {
      apply();
    }
  };

  const addHarmonicTheme = (palette: GeneratedPalette) => {
    const id = `custom-${Date.now()}`;
    const newTheme: ThemeDefinition = {
      id,
      name: palette.name,
      category: 'custom',
      description: `Bespoke Studio: Seed ${palette.seedHex} with harmonic precision shades`,
      colors: palette.colors,
      isCustom: true,
      seedColor: palette.seedHex,
      customConfig: {
        canvasColor: palette.canvasColor,
        primaryColor: palette.primaryColor,
        secondaryColor: palette.secondaryColor,
        cardColor: palette.cardColor,
        cardHoverColor: palette.cardHoverColor,
        subtleColor: palette.subtleColor,
        inputColor: palette.inputColor,
        highlightColor: palette.highlightColor,
        dockColor: palette.dockColor,
      },
    };

    const updated = [newTheme, ...customThemes];
    setCustomThemes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
    }

    setTheme(id);
  };

  const addCustomTheme = (
    name: string,
    canvasColor: string,
    primaryColor: string,
    secondaryColor: string
  ) => {
    const id = `custom-${Date.now()}`;
    const newTheme: ThemeDefinition = {
      id,
      name: name.trim() || 'Custom Palette',
      category: 'custom',
      description: `User Custom: Canvas ${canvasColor}, Accents ${primaryColor} & ${secondaryColor}`,
      colors: [canvasColor, primaryColor, secondaryColor, '#ffffff'],
      isCustom: true,
      customConfig: {
        canvasColor,
        primaryColor,
        secondaryColor,
      },
    };

    const updated = [newTheme, ...customThemes];
    setCustomThemes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
    }

    setTheme(id);
  };

  const deleteCustomTheme = (id: string) => {
    const updated = customThemes.filter((t) => t.id !== id);
    setCustomThemes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
    }

    if (theme === id) {
      setTheme('espresso-terracotta');
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme, allThemes);
  }, [theme, allThemes]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: allThemes,
        presetThemes: PRESET_THEMES,
        customThemes,
        addCustomTheme,
        addHarmonicTheme,
        deleteCustomTheme,
      }}
    >
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
