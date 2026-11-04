import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Palette,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Command,
  Sliders,
  User,
  PanelTop,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';
import { POPULAR_CURRENCIES } from '../../utils/currency';
import { feedback } from '../../utils/feedback';
import { ThemeStudio } from '../settings/ThemeStudio';
import type { NavbarHeight, NavbarGlass } from '../../types';

interface SlideOverInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlideOverInspector: React.FC<SlideOverInspectorProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    exportDataAsJson,
    importDataFromJson,
    resetToDefaults,
  } = useApp();

  const [userNameInput, setUserNameInput] = useState(settings.userName);
  const [currencyInput, setCurrencyInput] = useState(settings.currency);
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrencyInput(settings.currency);
    setUserNameInput(settings.userName);
    setBudgetInput(settings.monthlyBudget.toString());
  }, [settings.currency, settings.userName, settings.monthlyBudget]);

  const handleCurrencyChange = async (val: string) => {
    setCurrencyInput(val);
    await updateSettings({ currency: val, currencyExplicit: true });
    feedback.playClick();
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetVal = parseFloat(budgetInput) || 2400;
    await updateSettings({
      userName: userNameInput.trim() || 'Alex',
      currency: currencyInput.trim() || '$',
      monthlyBudget: budgetVal,
      currencyExplicit: true,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleNavbarHeightChange = async (height: NavbarHeight) => {
    feedback.playClick();
    await updateSettings({ navbarHeight: height });
  };

  const handleNavbarGlassChange = async (glass: NavbarGlass) => {
    feedback.playClick();
    await updateSettings({ navbarGlass: glass });
  };

  const handleExportBackup = async () => {
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
      setImportStatus(ok ? 'Backup restored successfully.' : 'Invalid backup schema.');
    } catch {
      setImportStatus('Error reading backup file.');
    }

    setTimeout(() => setImportStatus(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('Reset database to clean starter data? This will overwrite your current entries.')) {
      await resetToDefaults();
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-Over Drawer: Fully Responsive (Full on mobile, wide & spacious on desktop) */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-full z-10 flex flex-col shadow-2xl border-l border-white/10"
            style={{ backgroundColor: 'var(--bg-canvas)' }}
          >
            {/* Drawer Header: Exactly matches Main Navbar Height, Safe Area, and Styling */}
            <div
              className={`sticky top-0 z-20 w-full px-5 sm:px-8 flex items-center justify-between select-none hairline-b transition-all duration-200 shrink-0 ${
                settings.navbarHeight === 'compact'
                  ? 'py-2'
                  : settings.navbarHeight === 'spacious'
                  ? 'py-4 sm:py-5'
                  : 'py-3'
              }`}
              style={{
                backgroundColor: 'var(--bg-canvas)',
                paddingTop: 'max(var(--sat, 0px), 0.75rem)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm border border-white/8 shrink-0"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--accent-primary)' }}
                >
                  <Sliders className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-[-0.04em]">
                    Settings & System
                  </h3>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white pressable transition-colors border border-white/8 hover:border-white/16 cursor-pointer shrink-0"
                style={{ backgroundColor: 'var(--bg-card)' }}
                aria-label="Close Settings"
                title="Close Settings (ESC)"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </motion.button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 flex flex-col gap-6 no-scrollbar pb-[max(var(--sab,0px),2.5rem)]">
              {/* Section 1: Workspace Profile & Defaults (Shown FIRST) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Workspace Profile
                    </span>
                  </div>
                  {savedNotice && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold animate-pulse text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveWorkspace} className="solid-card p-4 sm:p-5 flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-mono uppercase">
                        Name
                      </label>
                      <input
                        type="text"
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl solid-input text-xs font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-mono uppercase mb-1.5">
                        Currency Format
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

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-mono uppercase">
                        Monthly Budget Target
                      </label>
                      <input
                        type="number"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl solid-input text-xs font-medium focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 h-9 rounded-xl font-bold text-xs pressable shadow-sm transition-all flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
                    >
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Section 2: Themes & Palettes Studio (Shown SECOND) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Atmosphere & Colorways
                  </span>
                </div>

                <ThemeStudio />
              </div>

              {/* Section 3: Navigation Bar Customization */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <PanelTop className="w-4 h-4 text-zinc-400" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Navbar Customization
                  </span>
                </div>

                <div className="solid-card p-4 sm:p-5 flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Height */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Header Height
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: 'compact', label: 'Compact', desc: '48px slim' },
                            { id: 'default', label: 'Default', desc: '56px' },
                            { id: 'spacious', label: 'Spacious', desc: '66px airy' },
                          ] as const
                        ).map((h) => {
                          const isSel = (settings.navbarHeight || 'default') === h.id;
                          return (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => handleNavbarHeightChange(h.id)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer pressable ${
                                isSel
                                  ? 'border-white/30 ring-1 ring-white/20 bg-white/[0.08]'
                                  : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                              }`}
                            >
                              <span className="text-xs font-bold text-white block">
                                {h.label}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400 mt-0.5 block">
                                {h.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Material */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Glass Material
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: 'solid', label: 'Solid', desc: 'Opaque' },
                            { id: 'glass', label: 'Frosted', desc: '20px blur' },
                            { id: 'vibrant', label: 'Vibrant', desc: 'Glow glass' },
                          ] as const
                        ).map((g) => {
                          const isSel = (settings.navbarGlass || 'solid') === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleNavbarGlassChange(g.id)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer pressable ${
                                isSel
                                  ? 'border-white/30 ring-1 ring-white/20 bg-white/[0.08]'
                                  : 'border-white/8 hover:border-white/16 bg-white/[0.02]'
                              }`}
                            >
                              <span className="text-xs font-bold text-white block">
                                {g.label}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400 mt-0.5 block">
                                {g.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Audio & Tactile Haptics */}
              <div>
                <div className="flex items-center justify-between solid-card p-4">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-zinc-300" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-zinc-500" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Tactile Sounds & Feedback
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Synthetic mechanical clicks & completion chimes
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className={`w-11 h-6 rounded-full transition-colors relative pressable cursor-pointer ${
                      soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        soundEnabled ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Section 5: Data Sovereignty */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Data Sovereignty & Portability
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                  100% offline-first Dexie.js IndexedDB storage. Zero cloud telemetry, zero account walls.
                </p>

                {importStatus && (
                  <div className="mb-3 p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white">
                    {importStatus}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 text-zinc-200 text-xs font-semibold pressable cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 text-zinc-200 text-xs font-semibold pressable cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2.5 w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium pressable transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset starter database</span>
                </button>
              </div>

              {/* Section 6: Target Packaging & Specs */}
              <div className="solid-card p-4 flex flex-col gap-3">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Target Packaging & Specs
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/5">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                    <div>
                      <span className="font-medium text-zinc-200 block text-[11px]">Mobile</span>
                      <span className="text-[9px] text-zinc-500 font-mono">Capacitor 6/7</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/5">
                    <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                    <div>
                      <span className="font-medium text-zinc-200 block text-[11px]">Desktop</span>
                      <span className="text-[9px] text-zinc-500 font-mono">Electron</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 hairline-t">
                  <span>Taskify OS v1.0.0 • Dexie Local-First</span>
                  <span>MIT License</span>
                </div>
              </div>

              {/* Section 7: Keyboard Navigation */}
              <div className="pt-2 hairline-t">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-2">
                  <Command className="w-3.5 h-3.5" />
                  <span>Keyboard Shortcuts</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] font-mono text-zinc-400">
                  <span className="p-1 rounded bg-white/[0.03] text-center">1 Today</span>
                  <span className="p-1 rounded bg-white/[0.03] text-center">2 Tasks</span>
                  <span className="p-1 rounded bg-white/[0.03] text-center">3 Habits</span>
                  <span className="p-1 rounded bg-white/[0.03] text-center">4 Streaks</span>
                  <span className="p-1 rounded bg-white/[0.03] text-center">5 Finance</span>
                  <span className="p-1 rounded bg-white/[0.03] text-center">6 Settings</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};