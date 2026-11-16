import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Moon,
  Feather,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { feedback } from '../../utils/feedback';

export const ThemeStudio: React.FC = () => {
  const { theme, setTheme, surfaceMaterial, setSurfaceMaterial, themes } = useTheme();

  const isGlassMode = surfaceMaterial !== 'classic-solid';
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredThemes = themes.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  // User requirement: initially display only 3 themes, reveal the rest via "Show more"
  const visibleThemes = isExpanded ? filteredThemes : filteredThemes.slice(0, 3);
  const remainingCount = Math.max(0, filteredThemes.length - 3);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'soft':
        return { label: 'Soft & Cozy', color: '#c6d77b', icon: Feather };
      case 'aesthetic':
        return { label: 'Aesthetic Pastel', color: '#f472b6', icon: Sparkles };
      case 'minimalist':
        return { label: 'Minimalist', color: '#38bdf8', icon: Sliders };
      case 'dark':
        return { label: 'Dark & OLED', color: '#a855f7', icon: Moon };
      case 'shader-iconic':
        return { label: 'Crystal & Blue', color: '#007aff', icon: Sparkles };
      case 'shader-aurora':
        return { label: 'Cosmic Aurora', color: '#c084fc', icon: Sparkles };
      case 'shader-amber':
        return { label: 'Molten Amber', color: '#f59e0b', icon: Feather };
      case 'shader-botanical':
        return { label: 'Zen Botanical', color: '#10b981', icon: Layers };
      case 'shader-cyber':
        return { label: 'Cyber Glacier', color: '#38bdf8', icon: Sliders };
      default:
        return { label: 'Theme', color: '#ffffff', icon: Layers };
    }
  };

  const categories = isGlassMode
    ? [
        { id: 'all', label: 'All Shaders' },
        { id: 'shader-iconic', label: 'Crystal & Blue' },
        { id: 'shader-aurora', label: 'Cosmic & Aurora' },
        { id: 'shader-amber', label: 'Warm & Amber' },
        { id: 'shader-botanical', label: 'Botanical & Zen' },
        { id: 'shader-cyber', label: 'Cyber & Glacier' },
      ]
    : [
        { id: 'all', label: 'All Palettes' },
        { id: 'soft', label: 'Soft & Cozy' },
        { id: 'aesthetic', label: 'Aesthetic' },
        { id: 'minimalist', label: 'Minimalist' },
        { id: 'dark', label: 'Dark & OLED' },
      ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Surface Material Segmented Switch */}
      <div className="flex flex-col gap-2 pb-3 border-b border-white/6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-medium text-zinc-300">
            Surface Material
          </label>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/6 text-zinc-400">
            {surfaceMaterial === 'classic-solid'
              ? 'OLED Battery Saver'
              : surfaceMaterial === 'liquid-glass'
              ? 'Liquid Glass'
              : 'Architectural Fluted'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'classic-solid', label: 'Classic Solid', desc: 'Minimal OLED' },
              { id: 'liquid-glass', label: 'Liquid Glass', desc: 'Glass Expo' },
              { id: 'fluted-glass', label: 'Fluted Glass', desc: 'Reeded Prism' },
            ] as const
          ).map((mat) => {
            const isSel = surfaceMaterial === mat.id;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  setSurfaceMaterial(mat.id);
                  setActiveCategory('all');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer pressable ${
                  isSel
                    ? 'border-white/35 ring-1.5 ring-white/20 bg-white/[0.08] shadow-md'
                    : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                }`}
              >
                <span className="text-xs font-bold text-white block truncate">{mat.label}</span>
                <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block truncate">{mat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Category Segmented Filter Tabs */}
      <div
        data-no-swipe="true"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth no-tab-swipe"
        style={{ touchAction: 'pan-x' }}
        onWheel={(e) => {
          if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
        {categories.map((tab) => {
          const isSel = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-no-swipe="true"
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

      {/* 3. Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleThemes.map((t) => {
          const isActive = theme === t.id;
          const badge = getCategoryBadge(t.category);
          const BadgeIcon = badge.icon;

          return (
            <motion.div
              key={t.id}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                feedback.playClick();
                setTheme(t.id);
              }}
              className={`group relative p-4 rounded-2xl border transition-colors duration-150 text-left flex flex-col justify-between cursor-pointer select-none ${
                isActive
                  ? 'border-white/35 ring-1.5 ring-white/20 shadow-xl bg-white/[0.06]'
                  : 'border-white/8 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <div>
                {/* Header: Title + Category Pill + Snappy Checkmark */}
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
                    <div
                      key={`theme-check-${t.id}`}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md shrink-0 animate-check-pop"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                      }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Bottom Row: Swatch Strip / Flowing Gradient */}
              <div className="flex items-center justify-between mt-3.5 pt-2.5 hairline-t">
                {t.isShaderGradient ? (
                  <div
                    className="w-24 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                    style={{
                      background: `linear-gradient(90deg, ${t.colors.join(', ')})`,
                    }}
                    title="Shader Gradient Spectrum"
                  />
                ) : (
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
                )}
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {isActive ? 'Active' : 'Select'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Show More / Show Less Accordion Button */}
      {filteredThemes.length > 3 && (
        <button
          type="button"
          onClick={() => {
            feedback.playClick();
            setIsExpanded((prev) => !prev);
          }}
          className="mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all pressable cursor-pointer"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 text-zinc-400" />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
              <span>Show More ({remainingCount} more themes)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
