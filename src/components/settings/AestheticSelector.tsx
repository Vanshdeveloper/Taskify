import React from 'react';
import { CircleDot } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';
import { BrandLogo } from '../ui/BrandLogo';
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

  const handleSelectAesthetic = async (val: string) => {
    feedback.playClick();
    await updateSettings({ appAesthetic: val as AppAesthetic });
  };

  return (
    <div
      className={`solid-card p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col gap-3.5 border ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
    >
      {/* Header with Title and Live Logo Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              color: 'var(--accent-primary)',
            }}
          >
            <CircleDot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Choose Your Aesthetic</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/8">
                App Logo & Favicon
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select your logo style for the app icon and Chrome browser tab.
            </p>
          </div>
        </div>

        {/* Live Active Preview Pill */}
        <div
          className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 shrink-0 flex items-center gap-2 self-start sm:self-auto shadow-inner"
          title="Live preview of selected logo"
        >
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Preview:</span>
          <BrandLogo aesthetic={currentAesthetic} />
        </div>
      </div>

      {/* Aesthetic Dropdown Selector */}
      <div className="max-w-md flex flex-col gap-1.5">
        <label className="text-[11px] text-zinc-400 font-mono font-medium uppercase tracking-wider">
          Logo Aesthetic Dropdown
        </label>
        <CustomSelect
          options={AESTHETIC_DEFINITIONS.map((a) => ({
            value: a.id,
            label: a.label,
          }))}
          value={currentAesthetic}
          onChange={handleSelectAesthetic}
          placeholder="Select logo aesthetic..."
        />
      </div>

      {/* Quick Visual Aesthetic Chips */}
      <div className="flex flex-col gap-1.5 pt-1 hairline-t">
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          Quick Swatches & Monograms
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {AESTHETIC_DEFINITIONS.map((item) => {
            const isSelected = item.id === currentAesthetic;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectAesthetic(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium pressable transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'border-white/30 text-white font-bold ring-1 ring-white/25 shadow-sm'
                    : 'border-white/8 text-zinc-400 hover:text-white hover:border-white/16 bg-white/[0.02]'
                }`}
                style={{
                  backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-primary) 22%, transparent)' : undefined,
                  borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                }}
              >
                {item.outerColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: item.outerColor }}
                  />
                )}
                <span>{item.previewText || (item.id === 'dynamic-theme' ? 'Theme Ring' : item.label.split(' ')[0])}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
