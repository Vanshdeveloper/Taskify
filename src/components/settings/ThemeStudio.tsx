import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Check,
  Trash2,
  X,
  Sliders,
  Layers,
  Moon,
  Feather,
  CheckCircle2,
  ArrowRight,
  Copy,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { feedback } from '../../utils/feedback';
import {
  generateHarmonicPalette,
  SEED_COLOR_PRESETS,
  getToneName,
  hexToHsl,
  getWcagContrast,
  exportPaletteAsCss,
  exportPaletteAsJson,
  type HarmonyMode,
  type SurfaceTone,
} from '../../utils/paletteGenerator';

export const ThemeStudio: React.FC = () => {
  const {
    theme,
    setTheme,
    themes,
    customThemes,
    addHarmonicTheme,
    deleteCustomTheme,
  } = useTheme();

  const [activeCategory, setActiveCategory] = useState<'all' | 'soft' | 'dark' | 'minimalist' | 'custom'>('all');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Single-Color Harmonic Seed & Tools State
  const [seedColor, setSeedColor] = useState('#f5773f');
  const [customName, setCustomName] = useState('');
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('analogous');
  const [surfaceTone, setSurfaceTone] = useState<SurfaceTone>('charcoal');
  const [copiedType, setCopiedType] = useState<'css' | 'json' | null>(null);

  // Live generated palette derived dynamically from chosen color & selected tools
  const generatedPalette = useMemo(() => {
    return generateHarmonicPalette(seedColor, customName, {
      harmony: harmonyMode,
      surface: surfaceTone,
    });
  }, [seedColor, customName, harmonyMode, surfaceTone]);

  // Real-time WCAG Accessibility Contrast Ratio
  const contrastInfo = useMemo(() => {
    return getWcagContrast(generatedPalette.primaryColor, generatedPalette.canvasColor);
  }, [generatedPalette]);

  const filteredThemes = themes.filter((t) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'custom') return t.isCustom;
    return t.category === activeCategory;
  });

  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    feedback.playSuccessChime();
    addHarmonicTheme(generatedPalette);
    setIsCreatorOpen(false);
    setCustomName('');
  };

  const handleCopyCss = async () => {
    try {
      feedback.playClick();
      const css = exportPaletteAsCss(generatedPalette);
      await navigator.clipboard.writeText(css);
      setCopiedType('css');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyJson = async () => {
    try {
      feedback.playClick();
      const json = exportPaletteAsJson(generatedPalette);
      await navigator.clipboard.writeText(json);
      setCopiedType('json');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'soft':
        return { label: 'Soft & Organic', color: '#c6d77b', icon: Feather };
      case 'dark':
        return { label: 'Dark & OLED', color: '#a855f7', icon: Moon };
      case 'minimalist':
        return { label: 'Minimalist', color: '#38bdf8', icon: Sliders };
      case 'custom':
        return { label: 'Bespoke Studio', color: '#f5773f', icon: Palette };
      default:
        return { label: 'Preset', color: '#ffffff', icon: Layers };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Category Segmented Chips & Creator Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth"
          style={{ touchAction: 'pan-x' }}
          onWheel={(e) => {
            if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
          {(
            [
              { id: 'all', label: 'All Themes' },
              { id: 'soft', label: 'Soft & Organic' },
              { id: 'dark', label: 'Dark & OLED' },
              { id: 'minimalist', label: 'Minimalist' },
              { id: 'custom', label: `Custom (${customThemes.length})` },
            ] as const
          ).map((tab) => {
            const isSel = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  setActiveCategory(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 pressable cursor-pointer ${
                  isSel
                    ? 'text-white border-white/20 shadow-md ring-1 ring-white/20'
                    : 'text-zinc-400 hover:text-white border-white/6 hover:border-white/12 bg-white/[0.02]'
                }`}
                style={{
                  backgroundColor: isSel ? 'var(--accent-primary)' : undefined,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tactile + Create Bespoke Theme Button */}
        <button
          type="button"
          onClick={() => {
            feedback.playClick();
            setIsCreatorOpen(true);
          }}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white border border-white/15 pressable shadow-lg transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Harmonic Palette Studio</span>
        </button>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredThemes.map((t) => {
          const isActive = theme === t.id;
          const badge = getCategoryBadge(t.category);
          const BadgeIcon = badge.icon;

          return (
            <motion.div
              key={t.id}
              layout
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                feedback.playClick();
                setTheme(t.id);
              }}
              className={`group relative p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer select-none ${
                isActive
                  ? 'border-white/40 ring-2 ring-white/25 shadow-2xl bg-white/[0.06]'
                  : 'border-white/8 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <div>
                {/* Header: Title + Category Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 border border-white/10"
                        style={{
                          backgroundColor: `${badge.color}15`,
                          color: badge.color,
                        }}
                      >
                        <BadgeIcon className="w-2.5 h-2.5" />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeThemeCheck"
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md shrink-0"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Bottom Row: 4-Color Swatch Strip + Delete Action */}
              <div className="flex items-center justify-between mt-3.5 pt-2.5 hairline-t">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/8">
                  {t.colors.map((c, idx) => (
                    <span
                      key={idx}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>

                {t.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      feedback.playClick();
                      deleteCustomTheme(t.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete custom theme"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Minimal & Aesthetic Single-Color Harmonic Palette Studio Modal */}
      <AnimatePresence>
        {isCreatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setIsCreatorOpen(false)}
            />

            {/* Modal Dialog Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              className="relative w-full max-w-lg solid-card p-5 sm:p-6 shadow-2xl flex flex-col gap-4 border z-10 max-h-[92vh] overflow-y-auto no-scrollbar"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 hairline-b">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: seedColor }}
                  >
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white tracking-tight">
                      Harmonic Palette Studio
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Pick 1 color — derive balanced harmony modes, surface depth, and contrast tokens.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] pressable transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTheme} className="flex flex-col gap-4">
                {/* 1. Single Color Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">
                      Select Seed Color
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">
                      {getToneName(hexToHsl(seedColor).h)} • {seedColor}
                    </span>
                  </div>

                  {/* Seed Swatches Grid */}
                  <div
                    className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-3 overflow-x-auto no-scrollbar scroll-smooth"
                    style={{ touchAction: 'pan-x' }}
                    onWheel={(e) => {
                      if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
                    }}
                  >
                    {SEED_COLOR_PRESETS.map((p) => {
                      const isChosen = seedColor.toLowerCase() === p.hex.toLowerCase();
                      return (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => {
                            feedback.playClick();
                            setSeedColor(p.hex);
                          }}
                          className={`w-full aspect-square rounded-xl border transition-all cursor-pointer relative flex items-center justify-center ${
                            isChosen
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-lg'
                              : 'border-white/15 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: p.hex }}
                          title={p.name}
                        >
                          {isChosen && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Precision Native Color Picker & Hex Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={seedColor}
                      onChange={(e) => setSeedColor(e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={seedColor}
                      onChange={(e) => setSeedColor(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl solid-input text-xs font-mono font-bold text-white focus:outline-none"
                      placeholder="#f5773f"
                    />
                  </div>
                </div>

                {/* 2. Precision Tools: Harmony Mode Selector */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold mb-1.5">
                    Harmony Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'analogous', label: 'Analogous', desc: '+35° Natural' },
                        { id: 'monochromatic', label: 'Monochrome', desc: 'Pure Tones' },
                        { id: 'complementary', label: 'Contrast', desc: '180° Opposite' },
                        { id: 'triadic', label: 'Triadic', desc: '120° Dynamic' },
                      ] as const
                    ).map((h) => {
                      const isSel = harmonyMode === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            feedback.playClick();
                            setHarmonyMode(h.id);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer pressable ${
                            isSel
                              ? 'border-white/30 ring-1 ring-white/20 bg-white/[0.08]'
                              : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                          }`}
                        >
                          <span className="text-xs font-bold text-white block">{h.label}</span>
                          <span className="text-[9px] font-mono text-zinc-400 mt-0.5 block">{h.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Precision Tools: Surface Depth & Tone */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold mb-1.5">
                    Surface Depth & Tone
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'oled', label: 'OLED Pure', desc: '1.8% Black' },
                        { id: 'charcoal', label: 'Charcoal', desc: '5.5% Slate' },
                        { id: 'velvet', label: 'Velvet', desc: '8.0% Tinted' },
                      ] as const
                    ).map((s) => {
                      const isSel = surfaceTone === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            feedback.playClick();
                            setSurfaceTone(s.id);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer pressable ${
                            isSel
                              ? 'border-white/30 ring-1 ring-white/20 bg-white/[0.08]'
                              : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                          }`}
                        >
                          <span className="text-xs font-bold text-white block">{s.label}</span>
                          <span className="text-[9px] font-mono text-zinc-400 mt-0.5 block">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Contrast Accessibility & Token Export Tools Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/8 gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${contrastInfo.passAA ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white font-mono">
                        {contrastInfo.ratio}:1 Contrast Ratio
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        WCAG 2.1 {contrastInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleCopyCss}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1 pressable transition-all cursor-pointer"
                      title="Copy CSS variables to clipboard"
                    >
                      {copiedType === 'css' ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedType === 'css' ? 'Copied' : 'Copy CSS'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1 pressable transition-all cursor-pointer"
                      title="Copy JSON tokens to clipboard"
                    >
                      {copiedType === 'json' ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedType === 'json' ? 'Copied' : 'JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* 5. Harmonic Color System Stops */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold mb-1.5">
                    Harmonic Color System
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 p-2 rounded-xl bg-black/40 border border-white/8">
                    {[
                      { role: 'Canvas', hex: generatedPalette.canvasColor },
                      { role: 'Card', hex: generatedPalette.cardColor },
                      { role: 'Primary', hex: generatedPalette.primaryColor },
                      { role: 'Secondary', hex: generatedPalette.secondaryColor },
                      { role: 'Luminous', hex: generatedPalette.highlightColor },
                    ].map((stop) => (
                      <div key={stop.role} className="flex flex-col items-center gap-1">
                        <span
                          className="w-full h-8 rounded-lg border border-white/10 shadow-sm"
                          style={{ backgroundColor: stop.hex }}
                        />
                        <span className="text-[9px] font-mono text-zinc-400 font-bold truncate">
                          {stop.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Live Hardware Preview Card */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold mb-1.5">
                    Live UI Preview
                  </label>
                  <div
                    className="p-4 rounded-2xl border transition-colors relative overflow-hidden"
                    style={{
                      backgroundColor: generatedPalette.canvasColor,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Simulated Mini Card */}
                    <div
                      className="p-3.5 rounded-xl border flex flex-col gap-2.5 shadow-md"
                      style={{
                        backgroundColor: generatedPalette.cardColor,
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-bold font-display tracking-tight"
                          style={{ color: generatedPalette.highlightColor }}
                        >
                          Deep Focus Sprint
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                          style={{
                            backgroundColor: `${generatedPalette.primaryColor}25`,
                            color: generatedPalette.primaryColor,
                          }}
                        >
                          High Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: '68%',
                              backgroundColor: generatedPalette.primaryColor,
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-mono font-bold"
                          style={{ color: generatedPalette.secondaryColor }}
                        >
                          68%
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className="text-[10px]"
                          style={{ color: generatedPalette.secondaryColor }}
                        >
                          Harmonic Tone Balanced
                        </span>
                        <div
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm flex items-center gap-1"
                          style={{ backgroundColor: generatedPalette.primaryColor }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Theme Name Input */}
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold mb-1">
                    Theme Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${generatedPalette.name}`}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl solid-input text-xs font-medium text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-2 hairline-t">
                  <button
                    type="button"
                    onClick={() => setIsCreatorOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white pressable transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-xs pressable shadow-lg transition-all cursor-pointer"
                    style={{ backgroundColor: generatedPalette.primaryColor }}
                  >
                    <span>Save & Apply Theme</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
