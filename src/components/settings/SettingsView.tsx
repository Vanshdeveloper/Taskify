import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  User,
  Smartphone,
  Laptop,
  CheckCircle2,
  Palette,
  PanelTop,
  TrendingUp,
  ArrowUpRight,
  Vibrate,
  Volume2,
  DollarSign,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';
import { POPULAR_CURRENCIES } from '../../utils/currency';
import { feedback } from '../../utils/feedback';
import { ThemeStudio } from './ThemeStudio';
import { AestheticSelector } from './AestheticSelector';
import { AppLogoMark } from '../ui/BrandLogo';
import type { NavbarHeight, NavbarGlass } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataAsJson,
    importDataFromJson,
    resetToDefaults,
    openExecutiveDashboard,
  } = useApp();

  const [userNameInput, setUserNameInput] = useState(settings.userName);
  const [currencyInput, setCurrencyInput] = useState(settings.currency);
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString());
  const [savedNotice, setSavedNotice] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserNameInput(settings.userName);
    setCurrencyInput(settings.currency);
    setBudgetInput(settings.monthlyBudget.toString());
  }, [settings.userName, settings.currency, settings.monthlyBudget]);

  const handleCurrencyChange = async (val: string) => {
    setCurrencyInput(val);
    await updateSettings({ currency: val, currencyExplicit: true });
    feedback.playClick();
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetVal = parseFloat(budgetInput) || 2400;
    await updateSettings({
      userName: userNameInput.trim() || 'Alex',
      currency: currencyInput.trim() || '$',
      monthlyBudget: budgetVal,
      currencyExplicit: true,
    });
    feedback.playClick();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleNavbarHeightChange = async (height: NavbarHeight) => {
    feedback.playClick();
    await updateSettings({ navbarHeight: height });
  };

  const handleNavbarGlassChange = async (glass: NavbarGlass) => {
    feedback.playClick();
    await updateSettings({ navbarGlass: glass });
  };

  const handleDownloadBackup = async () => {
    feedback.playClick();
    const jsonStr = await exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `taskify-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const ok = await importDataFromJson(text);
      if (ok) {
        feedback.playClick();
        setImportStatus('Backup restored successfully.');
      } else {
        setImportStatus('Failed to restore: invalid backup schema.');
      }
    } catch {
      setImportStatus('Error reading backup file.');
    }

    setTimeout(() => setImportStatus(null), 3500);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    feedback.playClick();
    if (window.confirm('Reset database to clean starter data? This will overwrite your current entries.')) {
      await resetToDefaults();
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-4xl mx-auto w-full pb-28 sm:pb-24 select-none relative z-10">
      {/* 1. Navigation Header */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(242, 106, 54, 0.15)', color: 'var(--accent-primary)' }}
          >
            SYSTEM
          </span>
          <span className="text-xs text-zinc-400 font-mono">Preferences & Sovereignty</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
          Settings
        </h1>
        <p className="text-xs text-zinc-400">
          Personalize workspace defaults, atmospheric themes, and local-first data controls.
        </p>
      </div>

      {/* 2. Workspace Profile & Financial Defaults */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl border flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-primary) 32%, transparent)',
                color: 'var(--accent-primary)',
              }}
            >
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white tracking-tight">
                Profile & Workspace Defaults
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Customize your display identity, regional currency, and monthly budget.
              </p>
            </div>
          </div>

          {savedNotice && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </motion.span>
          )}
        </div>

        <form onSubmit={handleSavePreferences} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Display Name */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-400 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-8 pr-3 py-2 rounded-xl solid-input text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Currency Format */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-400 mb-1.5">
                Currency Symbol
              </label>
              <CustomSelect
                value={currencyInput}
                onChange={handleCurrencyChange}
                options={POPULAR_CURRENCIES.map((c) => ({
                  value: c.symbol,
                  label: c.label,
                }))}
              />
            </div>

            {/* Monthly Budget */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-400 mb-1.5">
                Monthly Budget Target
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="2400"
                  className="w-full pl-8 pr-3 py-2 rounded-xl solid-input text-xs text-white focus:outline-none font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-white font-bold text-xs pressable shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* 3. Analytics Quick Launch Card */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-between gap-4 border cursor-pointer hover:border-white/20 transition-all group"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        onClick={() => {
          feedback.playClick();
          openExecutiveDashboard();
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md border shrink-0 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-primary) 30%, transparent)',
              color: 'var(--accent-primary)',
            }}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Executive Analytics</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/6 text-zinc-400">
                Trends & Velocity
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              Detailed productivity curves, task categories, and cashflow charts.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white pressable shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
          style={{ backgroundColor: 'var(--accent-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            feedback.playClick();
            openExecutiveDashboard();
          }}
        >
          <span>Open</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. App Icon & Brand Aesthetic Gallery (Unslop Redesign) */}
      <AestheticSelector />

      {/* 5. Atmosphere & Theme Studio */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-4 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/6">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, #a855f7 16%, transparent)',
              borderColor: 'color-mix(in srgb, #a855f7 32%, transparent)',
              color: '#c084fc',
            }}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">
              Atmosphere & Palettes
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select categorized themes from organic linen to high-contrast OLED black.
            </p>
          </div>
        </div>

        <ThemeStudio />
      </div>

      {/* 6. Physical Haptics & Tactile Sound Profiles */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-4 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, #f59e0b 16%, transparent)',
                borderColor: 'color-mix(in srgb, #f59e0b 32%, transparent)',
                color: '#fbbf24',
              }}
            >
              <Vibrate className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Haptic Vibration</span>
                <span
                  className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor:
                      settings.hapticFeedback !== false
                        ? 'rgba(102, 124, 62, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                    borderColor:
                      settings.hapticFeedback !== false
                        ? 'rgba(102, 124, 62, 0.4)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color:
                      settings.hapticFeedback !== false
                        ? 'var(--accent-success, #7da04a)'
                        : 'var(--text-muted)',
                  }}
                >
                  {settings.hapticFeedback !== false ? 'Active' : 'Muted'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Physical hardware vibration feedback on button presses and completions.
              </p>
            </div>
          </div>

          {/* Authentic Spring Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={settings.hapticFeedback !== false}
            onClick={async () => {
              const nextVal = !(settings.hapticFeedback !== false);
              feedback.setHapticsEnabled(nextVal);
              if (nextVal) {
                feedback.playClick();
              }
              await updateSettings({ hapticFeedback: nextVal });
            }}
            className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 border flex items-center ${
              settings.hapticFeedback !== false
                ? 'justify-end border-transparent'
                : 'justify-start bg-white/10 border-white/10'
            }`}
            style={{
              backgroundColor: settings.hapticFeedback !== false ? 'var(--accent-primary)' : undefined,
            }}
          >
            <motion.div
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 450 }}
              className="w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Tactile Audio Profile Selector */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-white">Tactile Click Sound</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {settings.hapticSound === 'precision' || settings.hapticSound === 'apple'
                ? 'Precision Tactile'
                : settings.hapticSound === 'mechanical'
                ? 'Mechanical'
                : settings.hapticSound === 'pop'
                ? 'Bubble Pop'
                : settings.hapticSound === 'subtle'
                ? 'Subtle Tick'
                : 'Muted'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(
              [
                { id: 'precision', label: 'Precision Tactile' },
                { id: 'mechanical', label: 'Mechanical' },
                { id: 'pop', label: 'Bubble Pop' },
                { id: 'subtle', label: 'Subtle Tick' },
                { id: 'mute', label: 'Muted' },
              ] as const
            ).map((sound) => {
              const currentSound = settings.hapticSound || 'precision';
              const isSelected = currentSound === sound.id || (currentSound === 'apple' && sound.id === 'precision');
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={async () => {
                    feedback.setHapticSound(sound.id);
                    feedback.playClick();
                    await updateSettings({ hapticSound: sound.id });
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all pressable cursor-pointer truncate ${
                    isSelected
                      ? 'text-white shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white border-white/6 hover:bg-white/[0.04]'
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--accent-primary)'
                      : 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-card)',
                  }}
                >
                  {sound.label}
                </button>
              );
            })}
          </div>

          {/* Haptic Vibration Intensity Slider */}
          {settings.hapticFeedback !== false && (
            <div className="pt-3 hairline-t flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-white">Vibration Strength</span>
                </div>
                <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  {(settings.hapticIntensity ?? 70) === 0 ? 'Off' : `${settings.hapticIntensity ?? 70}%`}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] font-mono text-zinc-500">Soft</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.hapticIntensity ?? 70}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    feedback.setHapticIntensity(val);
                    feedback.playClick();
                    updateSettings({ hapticIntensity: val });
                  }}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-[10px] font-mono text-zinc-500">Max</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. Focus Timer Screen Edge & Bezel Calibration */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-4 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, #f26a36 16%, transparent)',
                borderColor: 'color-mix(in srgb, #f26a36 32%, transparent)',
                color: '#f26a36',
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Timer Edge Progress & Curvature</span>
                <span
                  className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor:
                      settings.focusEdgeProgress !== false
                        ? 'rgba(242, 106, 54, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                    borderColor:
                      settings.focusEdgeProgress !== false
                        ? 'rgba(242, 106, 54, 0.4)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color:
                      settings.focusEdgeProgress !== false
                        ? '#f26a36'
                        : 'var(--text-muted)',
                  }}
                >
                  {settings.focusEdgeProgress !== false ? 'Enabled' : 'Muted'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Full-screen glowing perimeter contour with automatic display curvature compensation.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.focusEdgeProgress !== false}
            onClick={async () => {
              const nextVal = !(settings.focusEdgeProgress !== false);
              feedback.playClick();
              await updateSettings({ focusEdgeProgress: nextVal });
            }}
            className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 border flex items-center ${
              settings.focusEdgeProgress !== false
                ? 'justify-end border-transparent bg-[#f26a36]'
                : 'justify-start bg-white/10 border-white/10'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 450 }}
              className="w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Curvature & Bezel Radius Settings */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-white">Display Corner Curvature</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {settings.focusEdgeRadius === 'auto' || !settings.focusEdgeRadius
                ? 'Auto-Adaptive'
                : `${settings.focusEdgeRadius}px manual`}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: 'auto', label: 'Auto Fit', desc: 'Adaptive' },
              { id: 0, label: '0px', desc: 'Square' },
              { id: 24, label: '24px', desc: 'Subtle' },
              { id: 38, label: '38px', desc: 'Standard' },
              { id: 48, label: '48px', desc: 'Curved' },
              { id: 56, label: '56px', desc: 'Extreme' },
            ].map((r) => {
              const isSelected =
                r.id === 'auto'
                  ? settings.focusEdgeRadius === 'auto' || !settings.focusEdgeRadius
                  : Number(settings.focusEdgeRadius) === r.id;
              return (
                <button
                  key={String(r.id)}
                  type="button"
                  onClick={async () => {
                    feedback.playClick();
                    await updateSettings({ focusEdgeRadius: r.id as any });
                  }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer pressable ${
                    isSelected
                      ? 'border-[#f26a36] bg-[#f26a36]/15 text-white font-bold'
                      : 'border-white/8 hover:border-white/16 bg-white/[0.02] text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs block leading-tight">{r.label}</span>
                  <span className="text-[9px] opacity-70 mt-0.5 block">{r.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bezel Inset Setting */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Bezel Inset (Padding)</span>
            <span className="text-[10px] font-mono text-zinc-400">
              {settings.focusEdgeInset ?? 4}px padding
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 2, label: '2px', desc: 'Edge' },
              { id: 4, label: '4px', desc: 'Standard' },
              { id: 6, label: '6px', desc: 'Deep' },
              { id: 8, label: '8px', desc: 'Safe' },
            ].map((inset) => {
              const isSelected = (settings.focusEdgeInset ?? 4) === inset.id;
              return (
                <button
                  key={inset.id}
                  type="button"
                  onClick={async () => {
                    feedback.playClick();
                    await updateSettings({ focusEdgeInset: inset.id });
                  }}
                  className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer pressable ${
                    isSelected
                      ? 'border-[#f26a36] bg-[#f26a36]/15 text-white font-bold'
                      : 'border-white/8 hover:border-white/16 bg-white/[0.02] text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs block leading-tight">{inset.label}</span>
                  <span className="text-[9px] opacity-70 block">{inset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8. Navigation Bar Customization */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-4 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/6">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, #38bdf8 16%, transparent)',
              borderColor: 'color-mix(in srgb, #38bdf8 32%, transparent)',
              color: '#38bdf8',
            }}
          >
            <PanelTop className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">
              Navigation Bar Customization
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalize header height and translucent glass intensity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Header Height */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-zinc-400 mb-2">
              Header Height
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'compact', label: 'Compact', desc: '48px slim' },
                  { id: 'default', label: 'Default', desc: '56px Standard' },
                  { id: 'spacious', label: 'Spacious', desc: '66px airy' },
                ] as const
              ).map((h) => {
                const isSel = (settings.navbarHeight || 'default') === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleNavbarHeightChange(h.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer pressable ${
                      isSel
                        ? 'border-white/30 ring-2 ring-white/20 bg-white/[0.08]'
                        : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">{h.label}</span>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">{h.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Glass Material */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-zinc-400 mb-2">
              Material Translucency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'solid', label: 'Solid', desc: 'Opaque canvas' },
                  { id: 'glass', label: 'Frosted', desc: 'Fluid 20px blur' },
                  { id: 'vibrant', label: 'Vibrant', desc: 'Glow glass' },
                ] as const
              ).map((g) => {
                const isSel = (settings.navbarGlass || 'solid') === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleNavbarGlassChange(g.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer pressable ${
                      isSel
                        ? 'border-white/30 ring-2 ring-white/20 bg-white/[0.08]'
                        : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">{g.label}</span>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">{g.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 9. Data Sovereignty & Portability */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-4 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-white/6">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, #10b981 16%, transparent)',
              borderColor: 'color-mix(in srgb, #10b981 32%, transparent)',
              color: '#34d399',
            }}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">
              Data Portability & Sovereignty
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              100% offline-first architecture with instant JSON snapshots and zero tracking.
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/8 text-xs text-zinc-300 font-medium">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/8 text-xs font-medium text-zinc-200 pressable transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export JSON Snapshot</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/8 text-xs font-medium text-zinc-200 pressable transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Restore from File</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-medium text-rose-300 pressable ml-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Starter Data</span>
          </button>
        </div>
      </div>

      {/* 9. Target Platforms & System Spec */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-3.5 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-400">
          Target Packaging & Specs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/30 border border-white/5">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <div>
              <span className="font-medium text-zinc-200 block">Mobile Targets</span>
              <span className="text-[10px] text-zinc-500 font-mono">Capacitor • Android & iOS</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/30 border border-white/5">
            <Laptop className="w-4 h-4 text-zinc-400" />
            <div>
              <span className="font-medium text-zinc-200 block">Desktop Targets</span>
              <span className="text-[10px] text-zinc-500 font-mono">Electron • Windows, macOS & Linux</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-white/6">
          <div className="flex items-center gap-1.5">
            <AppLogoMark size={14} />
            <span>Taskify OS v1.0.0 • React 19 + TypeScript + Dexie</span>
          </div>
          <span>Open Source (MIT)</span>
        </div>
      </div>
    </div>
  );
};
