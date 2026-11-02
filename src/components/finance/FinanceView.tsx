import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import { FinanceModal } from '../modals/FinanceModal';

export const FinanceView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    financeStats,
    settings,
    updateSettings,
    requestDelete,
  } = useApp();

  const today = getTodayString();

  // Filters & Search
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

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

  const exportCsv = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'PaymentMethod'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.paymentMethod,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taskify-finance-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }
    return true;
  });

  const budgetUsagePercent = Math.min(
    100,
    Math.round((financeStats.monthlyExpenses / (financeStats.monthlyBudget || 1)) * 100)
  );

  const handleDeleteTransaction = (txId: string, desc: string) => {
    requestDelete({
      title: 'You sure you wanna delete this?',
      message: `It's giving permanent deletion vibes bestie. "${desc}" is about to vanish into thin air fr.`,
      confirmText: 'Yep, yeet it',
      cancelText: 'Nope, keep it',
      onConfirm: () => deleteTransaction(txId),
    });
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-24 select-none relative z-10">
      {/* 1. Header (Cleaned: "FINANCE, CASHFLOW ARCHITECTURE" line removed completely) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Wealth & Cashflow
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Maintain daily safe spend discipline and inspect capital velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/8 text-zinc-300 text-xs font-medium pressable transition-all"
            style={{ backgroundColor: 'var(--bg-card)' }}
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFinanceModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-white text-xs font-bold pressable shadow-lg transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Record</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Apple Card Style Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Safe-to-Spend Daily */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Safe Velocity
            </span>
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="mt-3">
            <span
              className="font-display text-xl sm:text-2xl font-bold tracking-tight font-mono tabular-nums"
              style={{ color: 'var(--accent-primary)' }}
            >
              {settings.currency}{financeStats.dailySafeToSpend.toFixed(0)}
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">per day remaining</p>
          </div>
        </div>

        {/* Monthly Income */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Monthly Inflow
            </span>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div className="mt-3">
            <span
              className="font-display text-xl sm:text-2xl font-bold tracking-tight font-mono tabular-nums"
              style={{ color: 'var(--accent-secondary)' }}
            >
              {settings.currency}{financeStats.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Recorded inflow</p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Monthly Outflow
            </span>
            <TrendingDown className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <span className="font-display text-xl sm:text-2xl font-bold text-zinc-200 tracking-tight font-mono tabular-nums">
              {settings.currency}{financeStats.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Recorded outflow</p>
          </div>
        </div>

        {/* Net Monthly Balance */}
        <div
          className="solid-card p-4 sm:p-5 flex flex-col justify-between shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Net Surplus
            </span>
            <PieChart className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <span
              className={`font-display text-xl sm:text-2xl font-bold tracking-tight font-mono tabular-nums ${
                financeStats.netBalance >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {financeStats.netBalance >= 0 ? '+' : ''}
              {settings.currency}{financeStats.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Net capital delta</p>
          </div>
        </div>
      </div>

      {/* 3. Monthly Budget Target Card */}
      <div
        className="solid-card p-4 sm:p-5 flex flex-col gap-2.5"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Monthly Spend Budget
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 font-mono tabular-nums">
              <span className="font-display text-base font-bold text-white">
                {settings.currency}{financeStats.monthlyExpenses.toFixed(0)}
              </span>
              <span className="text-xs text-zinc-500">
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

      {/* 4. Segmented Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="segmented-track flex items-center gap-0.5 self-start">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Income' },
            ] as const
          ).map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 text-xs font-medium pressable transition-all ${
                  isActive
                    ? 'segmented-thumb-active font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : undefined,
                  color: isActive ? '#ffffff' : undefined,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl solid-input text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 5. Clean Unified Transaction Ledger */}
      <div
        className="solid-card divide-y divide-white/[0.06] shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {filteredTransactions.length === 0 ? (
          <div className="py-14 px-4 text-center flex flex-col items-center justify-center">
            <DollarSign className="w-8 h-8 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-display text-sm font-semibold text-zinc-300">
              No transactions recorded
            </span>
            <p className="text-xs text-zinc-500 mt-1">Tap "Log Record" above to record your first inflow or expense.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <motion.div
                layout
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="group flex items-center justify-between p-4 sm:p-4.5 text-zinc-200 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
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

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {tx.description}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5 flex-wrap font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-black/30 text-zinc-400 border border-white/5">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="capitalize">{tx.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-display text-xs sm:text-sm font-bold font-mono tabular-nums ${
                      isIncome ? 'text-emerald-400' : 'text-zinc-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {settings.currency}
                    {tx.amount.toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                    className="opacity-40 hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 pressable transition-opacity"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Transaction Creation Modal */}
      <FinanceModal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} />
    </div>
  );
};
