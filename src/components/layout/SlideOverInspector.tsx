import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  User,
  PanelTop,
  Smartphone,
  Laptop,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Vibrate,
  Volume2,
  Sparkles,
  CreditCard,
  DollarSign,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';
import { POPULAR_CURRENCIES } from '../../utils/currency';
import { feedback } from '../../utils/feedback';
import { ThemeStudio } from '../settings/ThemeStudio';
import {
  checkForAppUpdates,
  triggerDirectDownload,
  getPlatformLabel,
  detectPlatform,
  APP_VERSION,
  type UpdateCheckResult,
} from '../../utils/updater';
import { APPLE_SPRINGS } from '../../utils/motion';
import type { NavbarHeight } from '../../types';

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
    openExecutiveDashboard,
    requestDelete,
  } = useApp();

  const [userNameInput, setUserNameInput] = useState(settings.userName);
  const [currencyInput, setCurrencyInput] = useState(settings.currency);
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString());
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
    feedback.playClick();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleNavbarHeightChange = async (height: NavbarHeight) => {
    feedback.playClick();
    await updateSettings({ navbarHeight: height });
  };

  const handleExportBackup = async () => {
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
      feedback.playClick();
      const text = await file.text();
      const success = await importDataFromJson(text);
      if (success) {
        setImportStatus('Backup restored successfully!');
      } else {
        setImportStatus('Failed to parse backup format.');
      }
    } catch {
      setImportStatus('Error reading backup file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleResetDatabase = () => {
    feedback.playClick();
    requestDelete({
      title: 'Reset to Starter Database?',
      message: 'This will purge all local custom tasks, routines, and records, restoring clean defaults. Cannot be undone.',
      confirmText: 'Reset Database',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await resetToDefaults();
        onClose();
      },
    });
  };

  // Software updates state
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateStatusNotice, setUpdateStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      checkForAppUpdates().then((res) => {
        if (isMounted) setUpdateResult(res);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleManualCheckUpdates = async () => {
    feedback.playClick();
    setIsCheckingUpdates(true);
    setUpdateStatusNotice(null);
    try {
      const res = await checkForAppUpdates({ force: true });
      setUpdateResult(res);
      if (res.error) {
        setUpdateStatusNotice(res.error);
      } else if (res.hasUpdate) {
        setUpdateStatusNotice(`Update v${res.latestVersion} available!`);
      } else {
        setUpdateStatusNotice('You are using the latest version');
      }
    } catch {
      setUpdateStatusNotice('Unable to check updates (offline)');
    } finally {
      setIsCheckingUpdates(false);
      setTimeout(() => setUpdateStatusNotice(null), 3500);
    }
  };

  const handleDownloadUpdate = () => {
    feedback.playClick();
    if (updateResult?.release?.downloadUrl) {
      triggerDirectDownload(
        updateResult.release.downloadUrl,
        updateResult.release.assetName || undefined
      );
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          {/* Frosted Glass Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Slide-over Apple Settings Sheet */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={APPLE_SPRINGS.sheet}
            className="relative w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full z-10 flex flex-col shadow-2xl border-l border-white/10 backdrop-blur-2xl overflow-hidden"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 94%, transparent)',
              transform: 'translateZ(0)',
            }}
          >
            {/* Apple Settings Navigation Header */}
            <div
              className="sticky top-0 z-20 w-full px-5 sm:px-7 py-3.5 flex items-center justify-between border-b border-white/8 shrink-0 bg-black/30 backdrop-blur-xl"
              style={{
                paddingTop: 'max(var(--sat, 0px), 0.85rem)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                  <Sliders className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white tracking-tight">
                    Settings
                  </h3>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/8"
                aria-label="Close Settings"
                title="Close Settings (ESC)"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Apple Settings Inset Grouped Scroll Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-6 no-scrollbar pb-[max(var(--sab,0px),2.5rem)]">
              {/* Apple User Monogram Profile Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/8 backdrop-blur-xl flex items-center gap-3.5 shadow-md">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-amber-400 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {userNameInput.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-base font-bold text-white truncate">
                    {userNameInput || 'Alex'}
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-400 truncate">
                    Taskify Workspace • 100% Local-First
                  </p>
                </div>
                {savedNotice && (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>

              {/* ========================================================
                  SECTION 1: WORKSPACE & FINANCES (Apple Inset Grouped)
                  ======================================================== */}
              <div className="flex flex-col gap-1.5">
                <span className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Workspace & Preferences
                </span>

                <div className="rounded-2xl bg-zinc-900/60 border border-white/8 backdrop-blur-xl overflow-hidden divide-y divide-white/6 shadow-lg">
                  {/* Name Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Your Name</span>
                    </div>

                    <form onSubmit={handleSaveWorkspace} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                        onBlur={handleSaveWorkspace}
                        className="w-28 sm:w-36 h-7 px-2.5 rounded-lg bg-white/5 border border-white/8 text-xs font-medium text-white text-right focus:outline-none focus:border-white/20"
                      />
                    </form>
                  </div>

                  {/* Currency Format Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Currency Symbol</span>
                    </div>

                    <div className="w-28 sm:w-36">
                      <CustomSelect
                        value={currencyInput}
                        onChange={handleCurrencyChange}
                        options={POPULAR_CURRENCIES.map((c) => ({
                          value: c.symbol,
                          label: c.label,
                        }))}
                      />
                    </div>
                  </div>

                  {/* Monthly Budget Target Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Monthly Budget</span>
                    </div>

                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      onBlur={handleSaveWorkspace}
                      className="w-28 sm:w-36 h-7 px-2.5 rounded-lg bg-white/5 border border-white/8 text-xs font-mono text-white text-right focus:outline-none focus:border-white/20"
                    />
                  </div>

                  {/* Executive Analytics Navigation Row */}
                  <div
                    onClick={() => {
                      feedback.playClick();
                      onClose();
                      openExecutiveDashboard();
                    }}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Executive Insights & Trends</span>
                        <span className="text-[10px] text-zinc-400">Routines, deep work & velocity</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-zinc-400 text-xs font-semibold">
                      <span>Open</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 2: APPEARANCE & THEMES (Apple Inset Grouped)
                  ======================================================== */}
              <div className="flex flex-col gap-1.5">
                <span className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Appearance & Atmosphere
                </span>

                <div className="rounded-2xl bg-zinc-900/60 border border-white/8 backdrop-blur-xl overflow-hidden divide-y divide-white/6 shadow-lg">
                  {/* Themes Studio */}
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Theme & Colorway</span>
                    </div>
                    <ThemeStudio />
                  </div>

                  {/* Navbar Height Selector */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                        <PanelTop className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Header Height</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-0.5">
                      {(
                        [
                          { id: 'compact', label: 'Compact' },
                          { id: 'default', label: 'Default' },
                          { id: 'spacious', label: 'Spacious' },
                        ] as const
                      ).map((h) => {
                        const isSel = (settings.navbarHeight || 'default') === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleNavbarHeightChange(h.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSel ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {h.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 3: SOUND & HAPTICS (Apple Inset Grouped)
                  ======================================================== */}
              <div className="flex flex-col gap-1.5">
                <span className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Sound & Haptics
                </span>

                <div className="rounded-2xl bg-zinc-900/60 border border-white/8 backdrop-blur-xl overflow-hidden divide-y divide-white/6 shadow-lg">
                  {/* Haptic Vibration Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400 shrink-0">
                        <Vibrate className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Haptic Vibration</span>
                        <span className="text-[10px] text-zinc-400">Tactile pulses on buttons & routines</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.hapticFeedback !== false}
                      onClick={async () => {
                        const nextVal = !(settings.hapticFeedback !== false);
                        feedback.setHapticsEnabled(nextVal);
                        if (nextVal) feedback.playClick();
                        await updateSettings({ hapticFeedback: nextVal });
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative pressable cursor-pointer p-0.5 flex items-center shrink-0 ${
                        settings.hapticFeedback !== false ? 'bg-[var(--accent-primary)] justify-end' : 'bg-zinc-700 justify-start'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>

                  {/* Tactile Click Sound Style */}
                  <div className="p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                          <Volume2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-white">Tactile Click Sound</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-0.5">
                      {(
                        [
                          { id: 'precision', label: 'Precision' },
                          { id: 'mechanical', label: 'Mechanical' },
                          { id: 'pop', label: 'Pop' },
                          { id: 'subtle', label: 'Subtle' },
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
                            className={`py-1 px-1.5 rounded-xl text-xs font-medium border text-center transition-all pressable cursor-pointer truncate ${
                              isSelected
                                ? 'bg-white/15 text-white border-white/25 shadow-sm font-bold'
                                : 'text-zinc-400 hover:text-white border-white/6 hover:bg-white/[0.04]'
                            }`}
                          >
                            {sound.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Haptic Vibration Intensity Slider */}
                  {settings.hapticFeedback !== false && (
                    <div className="p-3.5 hairline-t flex flex-col gap-2">
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

                  {/* Focus Edge Progress Glow Toggle */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Screen Edge Progress Glow</span>
                        <span className="text-[10px] text-zinc-400">Glowing perimeter contour during timer</span>
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
                      className={`w-11 h-6 rounded-full transition-colors relative pressable cursor-pointer p-0.5 flex items-center shrink-0 ${
                        settings.focusEdgeProgress !== false ? 'bg-[#F26A36] justify-end' : 'bg-zinc-700 justify-start'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 4: DATA & BACKUP (Apple Inset Grouped)
                  ======================================================== */}
              <div className="flex flex-col gap-1.5">
                <span className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Data Sovereignty & Backup
                </span>

                <div className="rounded-2xl bg-zinc-900/60 border border-white/8 backdrop-blur-xl overflow-hidden divide-y divide-white/6 shadow-lg">
                  {importStatus && (
                    <div className="p-3 bg-white/5 text-xs text-white text-center font-mono">
                      {importStatus}
                    </div>
                  )}

                  {/* Export Backup Row */}
                  <div
                    onClick={handleExportBackup}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Export Local Backup (JSON)</span>
                        <span className="text-[10px] text-zinc-400">100% offline-first Dexie.js database</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>

                  {/* Restore Backup Row */}
                  <label className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Restore from Backup</span>
                        <span className="text-[10px] text-zinc-400">Select previously exported .json file</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* Reset Database Row */}
                  <div
                    onClick={handleResetDatabase}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-rose-500/10 transition-colors cursor-pointer text-rose-400"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold">Reset to Starter Database</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-rose-500/50" />
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 5: SOFTWARE UPDATES
                  ======================================================== */}
              <div className="flex flex-col gap-1.5">
                <span className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Software Updates
                </span>

                <div className="rounded-2xl bg-zinc-900/60 border border-white/8 backdrop-blur-xl overflow-hidden p-3.5 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-sm"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--accent-primary) 32%, transparent)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">App Version</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/6 text-zinc-300">
                            v{APP_VERSION}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {getPlatformLabel(detectPlatform())}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualCheckUpdates}
                      disabled={isCheckingUpdates}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/6 hover:bg-white/10 border border-white/8 text-[11px] font-semibold text-zinc-200 pressable transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      title="Check for new releases"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                      <span>{isCheckingUpdates ? 'Checking...' : 'Refresh'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-2">
                    <div className="text-[11px] font-mono">
                      {updateStatusNotice ? (
                        <span className="text-emerald-400 font-semibold">{updateStatusNotice}</span>
                      ) : updateResult?.hasUpdate ? (
                        <span className="text-amber-400 font-semibold">
                          Update v{updateResult.latestVersion} available!
                        </span>
                      ) : isCheckingUpdates ? (
                        <span className="text-zinc-400">Checking for updates...</span>
                      ) : (
                        <span className="text-zinc-400">Up to date (v{APP_VERSION})</span>
                      )}
                    </div>

                    {updateResult?.hasUpdate && updateResult.release?.downloadUrl && (
                      <button
                        type="button"
                        onClick={handleDownloadUpdate}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-white font-bold text-xs pressable shadow-lg transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Update (v{updateResult.latestVersion})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 6: ABOUT & SPECS
                  ======================================================== */}
              <div className="rounded-2xl bg-zinc-900/40 border border-white/6 p-4 flex flex-col gap-2.5 text-center text-xs text-zinc-500 font-mono">
                <div className="flex items-center justify-center gap-4 text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Capacitor Mobile
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5" /> Electron Desktop
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Taskify v{APP_VERSION} • Offline-First Dexie.js • MIT License
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
