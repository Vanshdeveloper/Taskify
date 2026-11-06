import React, { createContext, useContext, useEffect, useState, startTransition } from 'react';

export interface ThemeDefinition {
  id: string;
  name: string;
  category: 'soft' | 'aesthetic' | 'minimalist' | 'dark';
  description: string;
  colors: string[]; // [canvas, primary, secondary, highlight/accent]
}

export const PRESET_THEMES: ThemeDefinition[] = [
  // 1. Soft & Cozy (Earthy, Lavender, Peach, Warm tones)
  {
    id: 'espresso-terracotta',
    name: 'Espresso & Tangerine',
    category: 'soft',
    description: 'Flagship Warm Espresso: Rich chocolate cocoa, radiant tangerine terracotta, golden ochre, and warm linen.',
    colors: ['#160f0d', '#f26a36', '#e5a42f', '#fdf3e5'],
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist & Lilac',
    category: 'soft',
    description: 'Adorable evening serenity: Twilight violet slate, pastel lilac bloom, soft rose, and lavender milk.',
    colors: ['#13101c', '#c084fc', '#f472b6', '#faf5ff'],
  },
  {
    id: 'peach-cashmere',
    name: 'Peach Cashmere & Truffle',
    category: 'soft',
    description: 'Cozy cashmere warmth: Roasted almond truffle, sweet peach apricot, honey amber, and cream.',
    colors: ['#17110e', '#fb923c', '#f59e0b', '#fff7ed'],
  },
  {
    id: 'pistachio-cream',
    name: 'Pistachio Leaf & Cream',
    category: 'soft',
    description: 'Subtle botanical comfort: Pistachio leaf green, dusty blush rose, soft ivory cream, and deep moss canvas.',
    colors: ['#131910', '#c6d77b', '#c17685', '#fffff6'],
  },
  {
    id: 'forest-rose',
    name: 'Forest Moss & Dusty Rose',
    category: 'soft',
    description: 'Woodland tranquility: Deep emerald moss, spring lime green, dusty mauve rose, and ivory frost.',
    colors: ['#0c130f', '#7da04a', '#d6798c', '#f7f9f6'],
  },
  {
    id: 'kyoto-matcha',
    name: 'Kyoto Matcha & Bamboo',
    category: 'soft',
    description: 'Zen botanical garden: Dark evergreen canvas, fresh wasabi matcha, Kyoto gold, and warm tea foam.',
    colors: ['#0a110c', '#84cc16', '#eab308', '#f7fee7'],
  },
  {
    id: 'amber-dune',
    name: 'Amber Dune & Sahara Gold',
    category: 'soft',
    description: 'Sunset desert breeze: Twilight sand dunes, molten liquid gold, terracotta copper, and sunlit linen.',
    colors: ['#120e0a', '#f59e0b', '#ea580c', '#fef3c7'],
  },

  // 2. Aesthetic & Pastel (Adorable, Sakura, Sweet Mint, Cotton Clouds)
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom & Sakura Noir',
    category: 'aesthetic',
    description: 'Tokyo spring aesthetic: Noir plum canvas, delicate sakura petal pink, blossom rose, and cherry cream.',
    colors: ['#150d14', '#f472b6', '#fb7185', '#fff1f2'],
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte & Sweet Foam',
    category: 'aesthetic',
    description: 'Cafe delight: Soothing pastel sweet mint, creamy butter vanilla froth, fresh jade, and silky milk.',
    colors: ['#0f1713', '#4ade80', '#facc15', '#f0fdf4'],
  },
  {
    id: 'cloud-nine',
    name: 'Cloud Nine & Cotton Candy',
    category: 'aesthetic',
    description: 'Dreamy sky pastel: Twilight azure slate, gentle periwinkle, cotton lilac candy, and cloud milk.',
    colors: ['#0d131f', '#60a5fa', '#c084fc', '#eff6ff'],
  },

  // 3. Minimalist & Architectural (Scandinavian, Studio, Titanium)
  {
    id: 'nordic-frost',
    name: 'Nordic Frost & Platinum',
    category: 'minimalist',
    description: 'Arctic architecture: Glacier titanium slate, arctic sky blue, glacier indigo, and crisp platinum typography.',
    colors: ['#0b0f14', '#38bdf8', '#818cf8', '#f1f5f9'],
  },
  {
    id: 'sage-studio',
    name: 'Sage Studio & Danish Pine',
    category: 'minimalist',
    description: 'Modern Nordic studio: Danish pine canvas, muted architectural sage, clean slate, and pure frost.',
    colors: ['#0d1411', '#86efac', '#94a3b8', '#f0fdf4'],
  },
  {
    id: 'monochrome-pure',
    name: 'Monochrome Pure & Titanium',
    category: 'minimalist',
    description: 'Apple executive minimalism: Deep titanium obsidian, pure titanium white, zinc mist, and crisp ivory typography.',
    colors: ['#09090b', '#f4f4f5', '#a1a1aa', '#ffffff'],
  },
  {
    id: 'warm-sandstone',
    name: 'Warm Sandstone & Alabaster',
    category: 'minimalist',
    description: 'Natural stone tranquility: Architectural charcoal stone, warm desert sandstone, silt, and alabaster linen.',
    colors: ['#141210', '#d4b996', '#a89078', '#faf7f2'],
  },

  // 4. Dark & OLED (True blacks, Deep ocean, Cyber violet, Velvet wine)
  {
    id: 'obsidian-pure',
    name: 'Obsidian Pure OLED',
    category: 'dark',
    description: 'Pitch black #070709 OLED canvas, vivid electric blue, coral rose, and surgical razor-sharp contrast.',
    colors: ['#070709', '#3b82f6', '#f43f5e', '#f4f4f5'],
  },
  {
    id: 'velvet-burgundy',
    name: 'Velvet Wine & Dusty Rose',
    category: 'dark',
    description: 'Rich evening luxury: Deep mahogany wine noir, dusty rose mauve, delicate blush pink, and ivory light.',
    colors: ['#12080a', '#c17685', '#f2cece', '#fffff6'],
  },
  {
    id: 'tokyo-neon',
    name: 'Tokyo Cyber Amethyst',
    category: 'dark',
    description: 'Cyber midnight black, radiant electric violet, neon cyan accents, and crisp silver luminescence.',
    colors: ['#090a10', '#a855f7', '#06b6d4', '#f8fafc'],
  },
  {
    id: 'midnight-ocean',
    name: 'Midnight Ocean & Marine Cyan',
    category: 'dark',
    description: 'Abyssal deep sea navy: Oceanic void, bioluminescent marine cyan, sky azure, and pure foam.',
    colors: ['#080e18', '#22d3ee', '#38bdf8', '#f0fdfa'],
  },
];

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const PREFERENCE_STORAGE_KEY = 'taskify_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PREFERENCE_STORAGE_KEY);
      if (saved && PRESET_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'espresso-terracotta';
  });

  const applyThemeToDOM = (themeId: string) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Remove any dynamic inline style properties from previous versions
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
  };

  const setTheme = (newTheme: string) => {
    const apply = () => {
      startTransition(() => {
        setThemeState(newTheme);
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERENCE_STORAGE_KEY, newTheme);
      }
      applyThemeToDOM(newTheme);
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

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: PRESET_THEMES,
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
