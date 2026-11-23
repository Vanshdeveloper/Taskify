import type { AppAesthetic } from '../types';

export const AESTHETIC_DEFINITIONS: {
  id: AppAesthetic;
  label: string;
  category: 'circle' | 'text';
  outerColor?: string;
  previewText?: string;
}[] = [
  { id: 'dynamic-theme', label: 'Dynamic Theme Ring (Auto-Sync)', category: 'circle' },
  { id: 'espresso-terracotta', label: 'Espresso Terracotta Ring', category: 'circle', outerColor: '#f26a36' },
  { id: 'kyoto-matcha', label: 'Kyoto Matcha Ring', category: 'circle', outerColor: '#84cc16' },
  { id: 'lavender-mist', label: 'Lavender Mist Ring', category: 'circle', outerColor: '#c084fc' },
  { id: 'nordic-sky', label: 'Nordic Frost Sky Ring', category: 'circle', outerColor: '#38bdf8' },
  { id: 'molten-amber', label: 'Molten Sahara Amber Ring', category: 'circle', outerColor: '#f59e0b' },
  { id: 'minimal-obsidian', label: 'Monochrome Obsidian Ring', category: 'circle', outerColor: '#ffffff' },
  { id: 'text-dot', label: 'T • (Minimalist Initial)', category: 'text', previewText: 'T •' },
  { id: 'text-brackets', label: '[T] (Brutalist Architectural)', category: 'text', previewText: '[T]' },
  { id: 'text-caps', label: 'TASKIFY (Micro Bauhaus)', category: 'text', previewText: 'TASKIFY' },
  { id: 'text-terminal', label: '/// Taskify (Developer CLI)', category: 'text', previewText: '/// Taskify' },
  { id: 'text-spark', label: '✦ Taskify (Cosmic Monogram)', category: 'text', previewText: '✦ Taskify' },
];

/**
 * Dynamically updates the browser tab favicon (Chrome, Safari, Firefox, Edge)
 * to mirror the user's chosen aesthetic and active theme color.
 */
export function syncAppFavicon(aesthetic: AppAesthetic, activeThemePrimaryColor = '#f26a36') {
  if (typeof document === 'undefined') return;

  let outerColor = activeThemePrimaryColor;

  if (aesthetic === 'espresso-terracotta') outerColor = '#f26a36';
  else if (aesthetic === 'kyoto-matcha') outerColor = '#84cc16';
  else if (aesthetic === 'lavender-mist') outerColor = '#c084fc';
  else if (aesthetic === 'nordic-sky') outerColor = '#38bdf8';
  else if (aesthetic === 'molten-amber') outerColor = '#f59e0b';
  else if (aesthetic === 'minimal-obsidian') outerColor = '#ffffff';

  let svgContent: string;

  if (aesthetic === 'text-dot') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="24" fill="#160f0d"/>
      <text x="44" y="68" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="54" text-anchor="middle" fill="#ffffff">T</text>
      <circle cx="68" cy="62" r="7" fill="${activeThemePrimaryColor}"/>
    </svg>`;
  } else if (aesthetic === 'text-caps') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="24" fill="#160f0d"/>
      <text x="50" y="65" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="44" text-anchor="middle" fill="#ffffff">TK</text>
    </svg>`;
  } else if (aesthetic.startsWith('text-')) {
    let glyph = 'T';
    if (aesthetic === 'text-brackets') glyph = '[T]';
    else if (aesthetic === 'text-terminal') glyph = '///';
    else if (aesthetic === 'text-spark') glyph = '✦';

    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="24" fill="#160f0d"/>
      <text x="50" y="${glyph.length > 2 ? '60' : '68'}" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="${glyph.length > 2 ? '42' : '56'}" text-anchor="middle" fill="${activeThemePrimaryColor}">${glyph}</text>
    </svg>`;
  } else {
    // Concentric circular squircle app icon standard
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="24" fill="#160f0d"/>
      <circle cx="50" cy="50" r="38" fill="${outerColor}"/>
      <circle cx="50" cy="50" r="17" fill="${aesthetic === 'minimal-obsidian' ? '#160f0d' : '#ffffff'}"/>
    </svg>`;
  }

  const encoded = `data:image/svg+xml,${encodeURIComponent(svgContent.trim())}`;
  
  // 1. Update all favicon and touch icon links in document head by removing old elements and appending fresh ones
  const replaceFaviconLinks = (href: string, isSvg = true) => {
    try {
      const existing = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
      existing.forEach((el) => el.parentNode?.removeChild(el));

      const linkIcon = document.createElement('link');
      linkIcon.rel = 'icon';
      linkIcon.type = isSvg ? 'image/svg+xml' : 'image/png';
      linkIcon.href = href;
      document.head.appendChild(linkIcon);

      const linkShortcut = document.createElement('link');
      linkShortcut.rel = 'shortcut icon';
      linkShortcut.type = isSvg ? 'image/svg+xml' : 'image/png';
      linkShortcut.href = href;
      document.head.appendChild(linkShortcut);

      const linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon';
      linkApple.href = href;
      document.head.appendChild(linkApple);
    } catch {
      // Ignore DOM link replacement failures
    }
  };

  replaceFaviconLinks(encoded, true);

  // 2. Render to PNG for maximum cross-browser favicon compatibility and dispatch to Electron
  if (typeof window !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, 128, 128);
          ctx.drawImage(img, 0, 0, 128, 128);
          const pngUrl = canvas.toDataURL('image/png');
          replaceFaviconLinks(pngUrl, false);
          if (window.electronAPI?.setAppIcon) {
            window.electronAPI.setAppIcon(pngUrl);
          }
        }
      };
      img.src = encoded;
    } catch {
      // Ignore rasterization errors in unsupported environments
    }
  }
}
