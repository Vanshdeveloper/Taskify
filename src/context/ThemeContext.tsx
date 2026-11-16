import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SurfaceMaterial } from '../types';

export interface ThemeDefinition {
  id: string;
  name: string;
  category: 'soft' | 'aesthetic' | 'minimalist' | 'dark' | 'shader-aurora' | 'shader-amber' | 'shader-botanical' | 'shader-cyber' | 'shader-iconic';
  description: string;
  colors: string[]; // [canvas, primary, secondary, highlight/accent]
  isShaderGradient?: boolean;
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
    description: 'Pure executive minimalism: Deep titanium obsidian, pure titanium white, zinc mist, and crisp ivory typography.',
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

export const SHADER_GRADIENT_THEMES: ThemeDefinition[] = [
  {
    id: 'shader-pure-blue',
    name: 'Iconic Blue & Crystal White',
    category: 'shader-iconic',
    description: 'Iconic precision: Deep midnight canvas, vibrant royal blue action buttons, luminous crystal white specular nodes, and sky cyan highlights.',
    colors: ['#060911', '#007aff', '#ffffff', '#0a84ff'],
    isShaderGradient: true,
  },
  {
    id: 'shader-frosted-white',
    name: 'Frosted White & Classic Blue',
    category: 'shader-iconic',
    description: 'Frosted crystal elegance: Translucent high-luminance white glass surfaces, iconic blue action buttons, and iceberg platinum contrast.',
    colors: ['#090e17', '#007aff', '#f8fafc', '#ffffff'],
    isShaderGradient: true,
  },
  {
    id: 'shader-silk-aurora',
    name: 'Silk Aurora & Cosmic Rose',
    category: 'shader-aurora',
    description: 'Astral luminescence: Deep violet noir, liquid magenta glow, electric cyan ambient node, and starlight ivory.',
    colors: ['#0f0a14', '#f472b6', '#38bdf8', '#faf5ff'],
    isShaderGradient: true,
  },
  {
    id: 'shader-obsidian-amber',
    name: 'Obsidian Noir & Molten Amber',
    category: 'shader-amber',
    description: 'Molten luxury: Midnight obsidian base, fiery tangerine orbs, liquid sahara gold, and sunlit linen.',
    colors: ['#100b08', '#f26a36', '#f59e0b', '#fdf3e5'],
    isShaderGradient: true,
  },
  {
    id: 'shader-emerald-mist',
    name: 'Emerald Mist & Matcha Quartz',
    category: 'shader-botanical',
    description: 'Abyssal botanical garden: Forest slate void, vibrant matcha emerald, chartreuse glow, and jade mist.',
    colors: ['#08100c', '#10b981', '#84cc16', '#f0fdf4'],
    isShaderGradient: true,
  },
  {
    id: 'shader-sakura-crystal',
    name: 'Sakura Crystal & Twilight Plum',
    category: 'shader-aurora',
    description: 'Tokyo spring night: Royal plum noir, ethereal sakura blush, peony rose caustics, and pearl frost.',
    colors: ['#12090e', '#fb7185', '#f43f5e', '#fff1f2'],
    isShaderGradient: true,
  },
  {
    id: 'shader-arctic-glacier',
    name: 'Arctic Glacier & Cyan Borealis',
    category: 'shader-cyber',
    description: 'Sub-zero titanium: Glacier slate, deep arctic azure, radiant polar cyan, and iceberg platinum.',
    colors: ['#080d14', '#38bdf8', '#818cf8', '#f1f5f9'],
    isShaderGradient: true,
  },
  {
    id: 'shader-velvet-twilight',
    name: 'Velvet Twilight & Royal Amethyst',
    category: 'shader-aurora',
    description: 'Mahogany evening wine: Velvet wine noir, royal amethyst glow, dusty rose, and radiant silver.',
    colors: ['#100910', '#c17685', '#a855f7', '#fffff6'],
    isShaderGradient: true,
  },
  {
    id: 'shader-sunset-horizon',
    name: 'Sunset Horizon & Terracotta Wave',
    category: 'shader-amber',
    description: 'Twilight horizon: Warm espresso base, burning terracotta wave, sunset peach, and golden honey.',
    colors: ['#120a06', '#f97316', '#ec4899', '#fef3c7'],
    isShaderGradient: true,
  },
  {
    id: 'shader-cyber-matrix',
    name: 'Cyber Matrix & Electric Lime',
    category: 'shader-cyber',
    description: 'High-voltage matrix: Dark titanium slate, neon volt lime, cyber turquoise, and electric mint.',
    colors: ['#070a0e', '#84cc16', '#06b6d4', '#f8fafc'],
    isShaderGradient: true,
  },
];

export const ALL_THEMES: ThemeDefinition[] = [...PRESET_THEMES, ...SHADER_GRADIENT_THEMES];

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  surfaceMaterial: SurfaceMaterial;
  setSurfaceMaterial: (mat: SurfaceMaterial) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const PREFERENCE_STORAGE_KEY = 'taskify_theme_preference';
const SURFACE_STORAGE_KEY = 'taskify_surface_material';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [surfaceMaterial, setSurfaceMaterialState] = useState<SurfaceMaterial>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SURFACE_STORAGE_KEY);
      if (saved === 'classic-solid' || saved === 'liquid-glass' || saved === 'fluted-glass') {
        return saved;
      }
    }
    return 'classic-solid';
  });

  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PREFERENCE_STORAGE_KEY);
      if (saved && ALL_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'espresso-terracotta';
  });

  const applyThemeToDOM = (themeId: string) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const applySurfaceToDOM = (mat: SurfaceMaterial) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-surface', mat);
  };

  const setTheme = (newTheme: string) => {
    applyThemeToDOM(newTheme);
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PREFERENCE_STORAGE_KEY, newTheme);
      } catch {
        // Ignore storage quotas / disabled storage
      }
    }
  };

  const setSurfaceMaterial = (newMat: SurfaceMaterial) => {
    applySurfaceToDOM(newMat);
    setSurfaceMaterialState(newMat);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SURFACE_STORAGE_KEY, newMat);
      } catch {
        // Ignore storage quotas / disabled storage
      }
    }
    // Auto-align active theme when switching material mode
    if (newMat === 'classic-solid') {
      if (theme.startsWith('shader-')) {
        setTheme('espresso-terracotta');
      }
    } else {
      if (!theme.startsWith('shader-')) {
        setTheme('shader-obsidian-amber');
      }
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
    applySurfaceToDOM(surfaceMaterial);
  }, [theme, surfaceMaterial]);

  const activeThemes = surfaceMaterial === 'classic-solid' ? PRESET_THEMES : SHADER_GRADIENT_THEMES;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        surfaceMaterial,
        setSurfaceMaterial,
        themes: activeThemes,
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
