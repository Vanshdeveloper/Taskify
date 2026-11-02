import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { feedback } from '../../utils/feedback';

export interface DeleteConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  options: DeleteConfirmOptions | null;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  if (!options) return null;

  const title = options.title || 'You sure you wanna delete this?';
  const message =
    options.message || 'No cap, this will disappear into the void forever fr fr.';
  const confirmText = options.confirmText || 'Yep, yeet it';
  const cancelText = options.cancelText || 'Nope, keep it';

  const handleConfirm = async () => {
    feedback.playClick();
    await options.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    feedback.playClick();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="relative w-full max-w-sm solid-card p-6 shadow-2xl flex flex-col gap-4 border z-10"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Top icon and close button */}
            <div className="flex items-start justify-between">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner"
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  borderColor: 'rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                }}
              >
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Gen-Z Body */}
            <div>
              <h3 className="font-display text-lg font-black tracking-tight text-white">
                {title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-body">
                {message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 hairline-t">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 pressable transition-colors"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white pressable shadow-lg transition-transform"
                style={{
                  backgroundColor: '#e11d48',
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
