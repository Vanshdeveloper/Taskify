import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  User,
  Smartphone,
  Laptop,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';
import { POPULAR_CURRENCIES, autodetectCurrency } from '../../utils/currency';
import { feedback } from '../../utils/feedback';

export const SettingsView: React.FC = () => {
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
  const [savedNotice, setSavedNotice] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutodetectCurrency = () => {
    const detected = autodetectCurrency();
    setCurrencyInput(detected.symbol);
    feedback.playSuccessChime();
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetVal = parseFloat(budgetInput) || 2400;
    await updateSettings({
      userName: userNameInput.trim() || 'Alex',
      currency: currencyInput.trim() || '$',
      monthlyBudget: budgetVal,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleDownloadBackup = async () => {
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
    if (window.confirm('Reset database to clean starter data? This will overwrite your current entries.')) {
      await resetToDefaults();
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full pb-36 sm:pb-32 select-none relative z-10">
      {/* Header */}
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(242, 106, 54, 0.15)', color: 'var(--accent-primary)' }}
          >
            SYSTEM
          </span>
          <span className="text-xs text-zinc-400 font-mono">Preferences & Sovereignty</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
          Settings & Sovereignty
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Full data autonomy with zero cloud dependency and local persistence.
        </p>
      </div>

      {/* Local-First Data Sovereignty Card */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div
          className="p-2 rounded-xl border shrink-0"
          style={{
            backgroundColor: 'rgba(102, 124, 62, 0.2)',
            color: 'var(--accent-primary)',
            borderColor: 'rgba(102, 124, 62, 0.3)',
          }}
        >
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-xs font-bold text-white tracking-tight">
            100% Offline-First Architecture
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
            Taskify persists all objectives, atomic routines, and financial cashflow records exclusively within your browser's local IndexedDB engine via Dexie. Zero cloud telemetry, zero account walls, and complete data ownership.
          </p>
        </div>
      </div>

      {/* Preferences Section */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <form onSubmit={handleSavePreferences} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-400">
              Workspace Configuration
            </span>
            {savedNotice && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--accent-primary)' }}>
                <CheckCircle2 className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl solid-input text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-zinc-400">
                  Currency Format
                </label>
                <button
                  type="button"
                  onClick={handleAutodetectCurrency}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 pressable cursor-pointer"
                  title="Auto-detect based on your local device locale (zero APIs)"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-Detect</span>
                </button>
              </div>
              <CustomSelect
                value={currencyInput}
                onChange={setCurrencyInput}
                options={POPULAR_CURRENCIES.map((c) => ({
                  value: c.symbol,
                  label: c.label,
                }))}
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                Monthly Budget Target
              </label>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl solid-input text-xs text-white focus:outline-none font-mono font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 hairline-t">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white font-bold text-xs pressable shadow-lg"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Portability Section */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5 shadow-xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div>
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-400">
            Data Portability & Recovery
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Export or restore complete snapshots across desktop, tablet, and mobile devices.
          </p>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/8 text-xs text-zinc-300 font-medium">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/8 text-xs font-medium text-zinc-200 pressable transition-all"
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/8 text-xs font-medium text-zinc-200 pressable transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Restore from File</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-medium text-rose-300 pressable ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>

      {/* Target Platforms & System Spec */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-400">
          Target Packaging & Specs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/30 border border-white/5">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <div>
              <span className="font-medium text-zinc-200 block">Mobile Targets</span>
              <span className="text-[10px] text-zinc-500 font-mono">Capacitor 6/7 • Android & iOS</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/30 border border-white/5">
            <Laptop className="w-4 h-4 text-zinc-400" />
            <div>
              <span className="font-medium text-zinc-200 block">Desktop Targets</span>
              <span className="text-[10px] text-zinc-500 font-mono">Electron • Windows, macOS & Linux</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 hairline-t">
          <span>Taskify OS v1.0.0 • React 19 + TypeScript + Dexie</span>
          <span>Open Source (MIT)</span>
        </div>
      </div>
    </div>
  );
};
