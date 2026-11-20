import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AESTHETIC_DEFINITIONS } from '../../utils/favicon';
import { feedback } from '../../utils/feedback';
import type { AppAesthetic } from '../../types';

interface AestheticSelectorProps {
  className?: string;
}

export const AestheticSelector: React.FC<AestheticSelectorProps> = ({
  className = '',
}) => {
  const { settings, updateSettings } = useApp();
  const currentAesthetic = settings.appAesthetic || 'dynamic-theme';
  const [filterCategory, setFilterCategory] = useState<'all' | 'circle' | 'text'>('all');

  const handleSelectAesthetic = async (val: AppAesthetic) => {
    feedback.playClick();
    await updateSettings({ appAesthetic: val });
  };

  const filteredItems = AESTHETIC_DEFINITIONS.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  return (
    <div
      className={`solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-4 border ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
    >
      {/* Header: Title & Selected Category Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-primary) 32%, transparent)',
              color: 'var(--accent-primary)',
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>App Icon & Aesthetic</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/8">
                {AESTHETIC_DEFINITIONS.find((a) => a.id === currentAesthetic)?.label.split(' ')[0] || 'Active'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalize the app icon mark and browser tab favicon to match your taste.
            </p>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="segmented-track flex items-center gap-1 p-0.5 self-start sm:self-auto shrink-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'circle', label: 'Rings' },
              { id: 'text', label: 'Monograms' },
            ] as const
          ).map((tab) => {
            const isSel = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  setFilterCategory(tab.id);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold pressable transition-all cursor-pointer ${
                  isSel
                    ? 'text-white shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={{
                  backgroundColor: isSel ? 'var(--accent-primary)' : 'transparent',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Professional App Icon Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {filteredItems.map((item) => {
          const isSelected = item.id === currentAesthetic;

          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelectAesthetic(item.id)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-150 flex flex-col items-center justify-between gap-2.5 cursor-pointer select-none group ${
                isSelected
                  ? 'bg-white/[0.08] shadow-lg ring-2 border-transparent'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/8 hover:border-white/16'
              }`}
              style={{
                borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                boxShadow: isSelected ? '0 0 0 2px var(--accent-primary)' : undefined,
              }}
            >
              {/* Selected Top-Right Checkmark Badge */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-md z-10"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}

              {/* High-Definition App Icon Squircle */}
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-md border transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: '#160f0d',
                  borderColor: isSelected
                    ? 'var(--accent-primary)'
                    : 'rgba(255, 255, 255, 0.12)',
                }}
              >
                {item.category === 'circle' ? (
                  <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill={item.outerColor || 'var(--accent-primary)'}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="20"
                      fill={item.id === 'minimal-obsidian' ? '#160f0d' : '#ffffff'}
                    />
                  </svg>
                ) : item.id === 'text-dot' ? (
                  <div className="flex items-center gap-1">
                    <span className="font-display font-black text-xl text-white">T</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                  </div>
                ) : item.id === 'text-brackets' ? (
                  <div className="flex items-center font-mono">
                    <span className="text-zinc-500 font-bold text-xs">[</span>
                    <span
                      className="font-display font-black text-sm"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      T
                    </span>
                    <span className="text-zinc-500 font-bold text-xs">]</span>
                  </div>
                ) : item.id === 'text-caps' ? (
                  <div className="flex items-center gap-0.5">
                    <span className="font-display font-black text-[9px] text-white tracking-[0.2em] uppercase">
                      TASK
                    </span>
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                  </div>
                ) : item.id === 'text-terminal' ? (
                  <div className="flex items-center gap-1 font-mono">
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      ///
                    </span>
                    <span className="font-display font-bold text-xs text-white">T</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      ✦
                    </span>
                    <span className="font-display font-black text-xs text-white">T</span>
                  </div>
                )}
              </div>

              {/* Title & Micro-Label */}
              <div className="text-center w-full min-w-0">
                <span
                  className={`text-xs block truncate ${
                    isSelected ? 'font-bold text-white' : 'font-medium text-zinc-300'
                  }`}
                >
                  {item.id === 'dynamic-theme'
                    ? 'Dynamic Theme'
                    : item.label.replace(/\s*Ring.*|\s*\(.*\)/gi, '')}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 block truncate mt-0.5">
                  {item.id === 'dynamic-theme'
                    ? 'Auto-Sync Palette'
                    : item.category === 'circle'
                    ? 'Concentric Ring'
                    : 'Typographic Mark'}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
