import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Download,
  Trash2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import { SPRING_PILL } from '../../utils/motion';
import { getRandomDeletePrompt } from '../../utils/genz';
import { feedback } from '../../utils/feedback';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function getAmountTypographyClass(amountStr: string): string {
  const len = amountStr.length;
  if (len > 15) return 'text-xs sm:text-sm lg:text-base';
  if (len > 11) return 'text-sm sm:text-base lg:text-lg';
  if (len > 8) return 'text-base sm:text-lg lg:text-xl';
  return 'text-xl sm:text-2xl';
}

export const FinanceView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    financeStats,
    settings,
    updateSettings,
    requestDelete,
    openFinanceModal,
    openEditFinanceModal,
  } = useApp();

  const today = getTodayString();

  // View state: Bento Cards vs Swiss Compact Ledger
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Filters & Search
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString());

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      await updateSettings({ monthlyBudget: val });
    }
    setIsEditingBudget(false);
  };

  const exportCsv = async () => {
    feedback.playClick();
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'PaymentMethod'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.paymentMethod,
    ]);
    const rawCsv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const filename = `taskify-finance-${today}.csv`;

    if (Capacitor.isNativePlatform()) {
      try {
        const fileResult = await Filesystem.writeFile({
          path: filename,
          data: rawCsv,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: 'Taskify Financial Records',
          text: `Taskify financial transactions export as of ${today}`,
          url: fileResult.uri,
          dialogTitle: 'Export Financial Records (CSV)',
        });
        feedback.playSuccessChime();
        return;
      } catch (err) {
        console.warn('[Finance] Native file export fallback:', err);
      }
    }

    // Web / Desktop blob download
    const blob = new Blob([rawCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    feedback.playSuccessChime();
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [transactions, filterType, searchQuery]);

  const budgetUsagePercent = Math.min(
    100,
    Math.round((financeStats.monthlyExpenses / (financeStats.monthlyBudget || 1)) * 100)
  );

  const handleDeleteTransaction = (txId: string, desc: string) => {
    const prompt = getRandomDeletePrompt('finance', desc);
    requestDelete({
      title: prompt.title,
      message: prompt.message,
      confirmText: prompt.confirmText,
      cancelText: prompt.cancelText,
      onConfirm: () => deleteTransaction(txId),
    });
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-28 sm:pb-20 md:pb-12 select-none relative z-10">
      {/* 1. Header (Cleaned: "FINANCE, CASHFLOW ARCHITECTURE" line removed completely) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Wealth & Cashflow
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Maintain daily safe spend discipline and track your monthly budget.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={openFinanceModal}
          className="self-start sm:self-auto flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-semibold text-xs pressable shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Record</span>
        </motion.button>
      </div>

      {/* 2. 4 Apple Card Style Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Safe-to-Spend Daily */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate">
              Safe Spend
            </span>
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="mt-3 min-w-0">
            {(() => {
              const valStr = `${settings.currency}${financeStats.dailySafeToSpend.toFixed(0)}`;
              return (
                <span
                  className={`font-display font-bold tracking-tight font-mono tabular-nums truncate block min-w-0 ${getAmountTypographyClass(valStr)}`}
                  style={{ color: 'var(--accent-primary)' }}
                  title={valStr}
                >
                  {valStr}
                </span>
              );
            })()}
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">per day remaining</p>
          </div>
        </div>

        {/* Monthly Income */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate">
              Monthly Inflow
            </span>
            <TrendingUp className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div className="mt-3 min-w-0">
            {(() => {
              const valStr = `${settings.currency}${financeStats.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <span
                  className={`font-display font-bold tracking-tight font-mono tabular-nums truncate block min-w-0 ${getAmountTypographyClass(valStr)}`}
                  style={{ color: 'var(--accent-secondary)' }}
                  title={valStr}
                >
                  {valStr}
                </span>
              );
            })()}
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Recorded inflow</p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate">
              Monthly Outflow
            </span>
            <TrendingDown className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>
          <div className="mt-3 min-w-0">
            {(() => {
              const valStr = `${settings.currency}${financeStats.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <span
                  className={`font-display font-bold text-zinc-200 tracking-tight font-mono tabular-nums truncate block min-w-0 ${getAmountTypographyClass(valStr)}`}
                  title={valStr}
                >
                  {valStr}
                </span>
              );
            })()}
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Recorded outflow</p>
          </div>
        </div>

        {/* Net Monthly Balance */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate">
              Net Surplus
            </span>
            <PieChart className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>
          <div className="mt-3 min-w-0">
            {(() => {
              const sign = financeStats.netBalance >= 0 ? '+' : '';
              const valStr = `${sign}${settings.currency}${financeStats.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <span
                  className={`font-display font-bold tracking-tight font-mono tabular-nums truncate block min-w-0 ${
                    financeStats.netBalance >= 0 ? 'text-white' : 'text-rose-400'
                  } ${getAmountTypographyClass(valStr)}`}
                  title={valStr}
                >
                  {valStr}
                </span>
              );
            })()}
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Net capital delta</p>
          </div>
        </div>
      </div>

      {/* 3. Monthly Budget Target Card */}
      <div
        className="solid-card p-4 sm:p-5 flex flex-col gap-2.5 min-w-0 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Monthly Spend Budget
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 font-mono tabular-nums min-w-0 flex-wrap">
              <span className="font-display text-base font-bold text-white truncate max-w-full">
                {settings.currency}{financeStats.monthlyExpenses.toFixed(0)}
              </span>
              <span className="text-xs text-zinc-500 truncate max-w-full">
                of {settings.currency}{financeStats.monthlyBudget.toFixed(0)} ({budgetUsagePercent}%)
              </span>
            </div>
          </div>

          {isEditingBudget ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-24 px-2.5 py-1 rounded-lg solid-input text-xs font-mono font-bold text-white text-center focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveBudget}
                className="px-3 py-1 rounded-lg text-white text-xs font-bold pressable"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setBudgetInput(settings.monthlyBudget.toString());
                setIsEditingBudget(true);
              }}
              className="text-xs text-zinc-400 hover:text-white font-medium pressable self-start sm:self-auto"
            >
              Adjust Target
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${budgetUsagePercent}%`,
              backgroundColor: budgetUsagePercent > 90 ? '#f43f5e' : 'var(--accent-primary)',
            }}
          />
        </div>
      </div>

      {/* 4. Segmented Filter, Search & View Switcher (Standardized H-10 Geometry) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Liquid Filter Chips */}
        <div
          className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth no-tab-swipe"
          data-no-swipe="true"
          style={{ touchAction: 'pan-x' }}
          onWheel={(e) => {
            if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
          {(
            [
              { id: 'all', label: `All ${transactions.length}` },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Income' },
            ] as const
          ).map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-no-swipe="true"
                onClick={() => setFilterType(tab.id)}
                className={`relative px-3.5 py-1.5 text-xs font-bold rounded-xl pressable whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="financeFilterActiveChip"
                    transition={SPRING_PILL}
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search, Export CSV & View Switcher - Harmonized H-9 Geometry */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52 h-9">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="h-9 px-3 rounded-xl border border-white/8 text-zinc-300 hover:text-white text-xs font-medium pressable flex items-center gap-1.5 shrink-0 transition-colors"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>

          {/* View Mode Switcher (Cards vs Compact) - Standardized H-9 */}
          <div
            className="h-9 px-1 rounded-xl flex items-center gap-1 shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`relative w-7 h-7 rounded-lg flex items-center justify-center pressable transition-colors ${
                viewMode === 'cards' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Card View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="financeViewModePill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`relative w-7 h-7 rounded-lg flex items-center justify-center pressable transition-colors ${
                viewMode === 'compact' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Compact List View"
            >
              {viewMode === 'compact' && (
                <motion.div
                  layoutId="financeViewModePill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
              <List className="w-3.5 h-3.5 relative z-10" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Transactions (Dual Modes: Bento Cards vs Swiss Compact) */}
      {filteredTransactions.length === 0 ? (
        <div
          className="solid-card py-16 px-4 text-center flex flex-col items-center justify-center border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <Wallet className="w-8 h-8 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
          <span className="font-display text-sm font-semibold text-zinc-300">
            No transactions recorded
          </span>
          <p className="text-xs text-zinc-500 mt-1">Tap "Log Record" above to record your first inflow or expense.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'cards' ? (
            <motion.div
              key={`finance-cards-${filterType}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
            >
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    onClick={() => openEditFinanceModal(tx)}
                    className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-lg border transition-all cursor-pointer hover:border-white/20"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
                  >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: isIncome ? 'rgba(102, 124, 62, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: isIncome ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            borderColor: isIncome ? 'rgba(102, 124, 62, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/30 text-zinc-300 border border-white/6">
                          {tx.category}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransaction(tx.id, tx.description);
                        }}
                        className="opacity-40 hover:opacity-100 p-1 rounded-lg text-zinc-500 hover:text-rose-400 pressable transition-opacity cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 min-w-0">
                      <span className="text-sm font-bold text-white block line-clamp-1">
                        {tx.description}
                      </span>
                      {(() => {
                        const txAmountStr = `${isIncome ? '+' : '-'}${settings.currency}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        return (
                          <span
                            className={`font-display font-bold font-mono tabular-nums block mt-1 truncate max-w-full ${
                              txAmountStr.length > 14 ? 'text-base' : 'text-xl'
                            } ${isIncome ? 'text-emerald-400' : 'text-zinc-100'}`}
                            title={txAmountStr}
                          >
                            {txAmountStr}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 hairline-t text-[10px] font-mono text-zinc-500">
                    <span>{tx.date}</span>
                    <span className="capitalize">{tx.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
        </motion.div>
      ) : (
        /* CREATIVE VIEW 2: ULTRA-REFINED APPLE LEDGER COMPACT ROWS */
        <motion.div
          key={`finance-compact-${filterType}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="solid-card divide-y divide-white/[0.06] rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                onClick={() => openEditFinanceModal(tx)}
                className="group flex items-center justify-between p-3.5 sm:p-4 text-zinc-200 hover:bg-white/[0.03] transition-colors cursor-pointer gap-3 sm:gap-4"
              >
                  {/* Left Column: Direction Indicator Icon + 2-Line Clear Descriptor */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: isIncome ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        color: isIncome ? '#34d399' : 'var(--text-secondary)',
                        borderColor: isIncome ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs sm:text-sm font-semibold text-white truncate leading-snug">
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 mt-1 truncate font-mono leading-none">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/6 font-medium shrink-0">
                          {tx.category}
                        </span>
                        <span className="text-zinc-600 shrink-0">•</span>
                        <span className="text-zinc-400 shrink-0">{tx.date}</span>
                        <span className="text-zinc-600 shrink-0">•</span>
                        <span className="capitalize text-zinc-400 truncate">
                          {tx.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Prominent Monospace Amount & Fast Delete Action */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                    {(() => {
                      const txAmountStr = `${isIncome ? '+' : '-'}${settings.currency}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      return (
                        <span
                          className={`font-display font-bold font-mono tabular-nums tracking-tight truncate block ${
                            txAmountStr.length > 14 ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                          } ${isIncome ? 'text-emerald-400' : 'text-zinc-100'}`}
                          title={txAmountStr}
                        >
                          {txAmountStr}
                        </span>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTransaction(tx.id, tx.description);
                      }}
                      className="opacity-40 group-hover:opacity-100 w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] pressable transition-all shrink-0 cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
    </AnimatePresence>
  )}
    </div>
  );
};
