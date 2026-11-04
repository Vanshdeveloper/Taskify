/**
 * Precision Harmonic Single-Color Palette Generator
 * Derives a complete, cohesive, 100% designer-grade aesthetic system
 * (canvas, card surfaces, primary accent, analogous secondary, luminous highlight, dock)
 * from a single seed color.
 */

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
 * Generates an aesthetic, unified palette from a single seed color.
 */
export function generateHarmonicPalette(seedHex: string, customName?: string): GeneratedPalette {
  const { h, s, l } = hexToHsl(seedHex);

  // 1. Canvas: deep dark tinted background (5.5% lightness)
  const canvasColor = hslToHex(h, Math.min(s * 0.35, 26), 5.5);

  // 2. Card Surface: elevated container with optical depth (10.5% lightness)
  const cardColor = hslToHex(h, Math.min(s * 0.3, 22), 10.5);

  // 3. Card Hover: tactile interactive hover (14% lightness)
  const cardHoverColor = hslToHex(h, Math.min(s * 0.3, 22), 14);

  // 4. Subtle Surface: slightly elevated over canvas (8% lightness)
  const subtleColor = hslToHex(h, Math.min(s * 0.25, 20), 8);

  // 5. Sunken Input: recessed field (7% lightness)
  const inputColor = hslToHex(h, Math.min(s * 0.25, 18), 7);

  // 6. Primary Accent: chosen seed with calibrated luminance for crisp readability
  const calibratedLightness = Math.min(65, Math.max(48, l));
  const primaryColor = hslToHex(h, Math.max(s, 60), calibratedLightness);

  // 7. Secondary Accent: harmonious analogous split ((h + 35) % 360)
  const secondaryHue = (h + 35) % 360;
  const secondaryColor = hslToHex(
    secondaryHue,
    Math.min(s * 0.95, 88),
    Math.min(64, Math.max(50, l))
  );

  // 8. Highlight: luminous tinted typography / off-white (96% lightness)
  const highlightColor = hslToHex(h, Math.min(s * 0.15, 14), 96);

  // 9. Dock Glass: tinted translucent bar
  const dockColor = hslToHex(h, Math.min(s * 0.3, 25), 8.5);

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
  };
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
