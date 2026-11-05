/**
 * Precision Harmonic Single-Color Palette Generator
 * Derives a complete, cohesive, 100% designer-grade aesthetic system
 * (canvas, card surfaces, primary accent, analogous secondary, luminous highlight, dock)
 * from a single seed color.
 */

export type HarmonyMode = 'analogous' | 'monochromatic' | 'complementary' | 'triadic';
export type SurfaceTone = 'charcoal' | 'oled' | 'velvet';

export interface GeneratedPalette {
  seedHex: string;
  name: string;
  canvasColor: string;
  cardColor: string;
  cardHoverColor: string;
  subtleColor: string;
  inputColor: string;
  primaryColor: string;
  secondaryColor: string;
  highlightColor: string;
  dockColor: string;
  colors: string[]; // [canvas, primary, secondary, highlight]
  harmonyMode?: HarmonyMode;
  surfaceTone?: SurfaceTone;
}

// Convert Hex to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { h: 24, s: 80, l: 55 };

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return {
    h: (h + 360) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * normL - 1)) * normS;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = normL - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (normH >= 0 && normH < 60) {
    r = c; g = x; b = 0;
  } else if (normH >= 60 && normH < 120) {
    r = x; g = c; b = 0;
  } else if (normH >= 120 && normH < 180) {
    r = 0; g = c; b = x;
  } else if (normH >= 180 && normH < 240) {
    r = 0; g = x; b = c;
  } else if (normH >= 240 && normH < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Auto-name tone based on hue
export function getToneName(hue: number): string {
  if (hue >= 345 || hue < 15) return 'Crimson Velvet';
  if (hue >= 15 && hue < 45) return 'Terracotta Dawn';
  if (hue >= 45 && hue < 70) return 'Sahara Amber';
  if (hue >= 70 && hue < 140) return 'Matcha Forest';
  if (hue >= 140 && hue < 175) return 'Pistachio Jade';
  if (hue >= 175 && hue < 215) return 'Arctic Cyan';
  if (hue >= 215 && hue < 255) return 'Nordic Azure';
  if (hue >= 255 && hue < 290) return 'Cyber Violet';
  if (hue >= 290 && hue < 325) return 'Tokyo Amethyst';
  return 'Dusty Rose';
}

/**
 * Generates an aesthetic, unified palette from a single seed color with precision tools.
 */
export function generateHarmonicPalette(
  seedHex: string,
  customName?: string,
  options?: { harmony?: HarmonyMode; surface?: SurfaceTone }
): GeneratedPalette {
  const { h, s, l } = hexToHsl(seedHex);
  const harmony = options?.harmony || 'analogous';
  const surface = options?.surface || 'charcoal';

  // Base surface lightness by surface tone
  let canvasL = 5.5;
  let cardL = 10.5;
  let cardHoverL = 14;
  let subtleL = 8;
  let inputL = 7;
  let dockL = 8.5;

  if (surface === 'oled') {
    canvasL = 1.8;
    cardL = 6.2;
    cardHoverL = 9.5;
    subtleL = 4.2;
    inputL = 3.5;
    dockL = 4.0;
  } else if (surface === 'velvet') {
    canvasL = 8.0;
    cardL = 13.0;
    cardHoverL = 16.5;
    subtleL = 10.5;
    inputL = 9.5;
    dockL = 11.0;
  }

  // 1. Canvas: deep dark tinted background
  const canvasColor = hslToHex(h, Math.min(s * 0.35, 26), canvasL);

  // 2. Card Surface: elevated container with optical depth
  const cardColor = hslToHex(h, Math.min(s * 0.3, 22), cardL);

  // 3. Card Hover: tactile interactive hover
  const cardHoverColor = hslToHex(h, Math.min(s * 0.3, 22), cardHoverL);

  // 4. Subtle Surface: slightly elevated over canvas
  const subtleColor = hslToHex(h, Math.min(s * 0.25, 20), subtleL);

  // 5. Sunken Input: recessed field
  const inputColor = hslToHex(h, Math.min(s * 0.25, 18), inputL);

  // 6. Primary Accent: chosen seed with calibrated luminance for crisp readability
  const calibratedLightness = Math.min(65, Math.max(48, l));
  const primaryColor = hslToHex(h, Math.max(s, 60), calibratedLightness);

  // 7. Secondary Accent: derived from selected Harmony Mode
  let secondaryHue = (h + 35) % 360;
  let secondarySat = Math.min(s * 0.95, 88);
  let secondaryLight = Math.min(64, Math.max(50, l));

  if (harmony === 'monochromatic') {
    secondaryHue = h;
    secondarySat = Math.max(20, s * 0.5);
    secondaryLight = Math.min(85, calibratedLightness + 20);
  } else if (harmony === 'complementary') {
    secondaryHue = (h + 180) % 360;
  } else if (harmony === 'triadic') {
    secondaryHue = (h + 120) % 360;
  }

  const secondaryColor = hslToHex(secondaryHue, secondarySat, secondaryLight);

  // 8. Highlight: luminous tinted typography / off-white (96% lightness)
  const highlightColor = hslToHex(h, Math.min(s * 0.15, 14), 96);

  // 9. Dock Glass: tinted translucent bar
  const dockColor = hslToHex(h, Math.min(s * 0.3, 25), dockL);

  const defaultName = `${getToneName(h)} Studio`;

  return {
    seedHex,
    name: customName?.trim() || defaultName,
    canvasColor,
    cardColor,
    cardHoverColor,
    subtleColor,
    inputColor,
    primaryColor,
    secondaryColor,
    highlightColor,
    dockColor,
    colors: [canvasColor, primaryColor, secondaryColor, highlightColor],
    harmonyMode: harmony,
    surfaceTone: surface,
  };
}

// Relative luminance for WCAG contrast calculation
function getLuminance(hex: string): number {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return 0;
  const rgb = [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  const a = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/**
 * Calculates WCAG 2.1 contrast ratio and rating between foreground and background.
 */
export function getWcagContrast(
  fgHex: string,
  bgHex: string
): { ratio: number; label: string; passAA: boolean } {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const rounded = Math.round(ratio * 10) / 10;
  const passAA = ratio >= 4.5;
  const label = ratio >= 7 ? 'AAA Pass' : ratio >= 4.5 ? 'AA Pass' : ratio >= 3 ? 'AA Large' : 'Fair';
  return { ratio: rounded, label, passAA };
}

/**
 * Exports generated palette tokens as clean CSS custom properties.
 */
export function exportPaletteAsCss(palette: GeneratedPalette): string {
  return `:root {
  --bg-canvas: ${palette.canvasColor};
  --bg-card: ${palette.cardColor};
  --bg-subtle: ${palette.subtleColor};
  --accent-primary: ${palette.primaryColor};
  --accent-secondary: ${palette.secondaryColor};
  --text-highlight: ${palette.highlightColor};
  --dock-bg: ${palette.dockColor};
}`;
}

/**
 * Exports generated palette colors as JSON hex array.
 */
export function exportPaletteAsJson(palette: GeneratedPalette): string {
  return JSON.stringify(
    {
      name: palette.name,
      seedHex: palette.seedHex,
      harmony: palette.harmonyMode,
      surface: palette.surfaceTone,
      tokens: {
        canvas: palette.canvasColor,
        card: palette.cardColor,
        primary: palette.primaryColor,
        secondary: palette.secondaryColor,
        highlight: palette.highlightColor,
      },
    },
    null,
    2
  );
}

export const SEED_COLOR_PRESETS = [
  { name: 'Terracotta', hex: '#f5773f' },
  { name: 'Tokyo Violet', hex: '#a855f7' },
  { name: 'Arctic Cyan', hex: '#06b6d4' },
  { name: 'Emerald Moss', hex: '#10b981' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Crimson Rose', hex: '#f43f5e' },
  { name: 'Glacier Sky', hex: '#38bdf8' },
  { name: 'Kyoto Lime', hex: '#84cc16' },
  { name: 'Cobalt Blue', hex: '#3b82f6' },
  { name: 'Blush Mauve', hex: '#c17685' },
];
