import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import type { TransactionType, PaymentMethod } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { feedback } from '../../utils/feedback';
import { getEmptyFieldError } from '../../utils/genz';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, settings } = useApp();
  const today = getTodayString();

  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [validationError, setValidationError] = useState<string | null>(null);

  const expenseCategories = [
    'Food & Dining',
    'Groceries',
    'Transport',
    'Housing',
    'Utilities',
    'Entertainment',
    'Health',
    'Shopping',
    'Other',
  ];

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      feedback.playClick();
      setValidationError(getEmptyFieldError('finance_amount'));
      return;
    }

    await addTransaction({
      type: txType,
      amount: numAmount,
      description: description.trim() || category,
      category,
      date: date || today,
      paymentMethod,
    });

    feedback.playSuccessChime();
    setAmount('');
    setDescription('');
    setValidationError(null);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 27, stiffness: 380 }}
            className="relative w-full max-w-lg solid-card p-6 shadow-2xl flex flex-col gap-4 border z-10"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 hairline-b">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-base font-bold text-white tracking-tight">
                  New Cashflow Record
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Type Switcher */}
              <div className="segmented-track flex items-center gap-1 self-start">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setCategory('Food & Dining');
                  }}
                  className={`px-3.5 py-1 text-xs font-bold rounded-lg pressable transition-all ${
                    txType === 'expense'
                      ? 'segmented-thumb-active text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: txType === 'expense' ? 'var(--accent-primary)' : undefined,
                    color: txType === 'expense' ? '#ffffff' : undefined,
                  }}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setCategory('Salary');
                  }}
                  className={`px-3.5 py-1 text-xs font-bold rounded-lg pressable transition-all ${
                    txType === 'income'
                      ? 'segmented-thumb-active text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: txType === 'income' ? 'var(--accent-secondary)' : undefined,
                    color: txType === 'income' ? '#ffffff' : undefined,
                  }}
                >
                  Income Inflow
                </button>
              </div>

              {/* Amount & Description */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm font-bold">
                      {settings.currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className={`w-full h-10 pl-8 pr-3 rounded-xl solid-input text-sm font-mono font-bold text-white placeholder-zinc-500 focus:outline-none transition-all ${
                        validationError ? 'border-rose-500 ring-1 ring-rose-500/50' : ''
                      }`}
                      autoFocus
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Note (e.g. Lunch with team)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="mt-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="shrink-0 text-sm">💀</span>
                      <span>{validationError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Category, Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Category
                  </label>
                  <CustomSelect
                    options={txType === 'expense' ? expenseCategories : incomeCategories}
                    value={category}
                    onChange={setCategory}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Date
                  </label>
                  <CustomDatePicker value={date} onChange={setDate} />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Method
                  </label>
                  <CustomSelect
                    options={paymentMethods}
                    value={paymentMethod}
                    onChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 hairline-t mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white pressable"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs pressable shadow-lg flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Log Cashflow</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
