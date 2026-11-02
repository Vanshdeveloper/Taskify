import React, { useMemo } from 'react';
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

const GENZ_DELETE_PRESETS = [
  {
    title: 'You sure you wanna delete this?',
    message: 'No cap, this will disappear into the void forever fr fr.',
    confirmText: 'Yep, yeet it',
    cancelText: 'Nope, keep it',
  },
  {
    title: 'Whoa bestie, slow down...',
    message: 'This action is giving zero-reversibility. It is gone into the digital abyss.',
    confirmText: 'Yeet to oblivion',
    cancelText: 'Nah my bad',
  },
  {
    title: 'Permanent vibe check 🛑',
    message: 'Deleting this is definitely not demure, not mindful. Are we really doing this?',
    confirmText: 'Delete fr',
    cancelText: 'Wait hold up',
  },
  {
    title: 'Send it to the backrooms?',
    message: 'Once deleted, even Ctrl+Z cannot clutch this up. You 100% positive?',
    confirmText: 'Send it 🚀',
    cancelText: 'Let it cook',
  },
  {
    title: 'It is giving RIP 💀',
    message: 'This entry is about to be cooked. Zero saves, zero respawns.',
    confirmText: 'Cook it',
    cancelText: 'Spare its life',
  },
  {
    title: 'Deleting this is crazy 😭',
    message: 'Ong this data will vanish forever. You are really letting it go?',
    confirmText: 'Straight to trash',
    cancelText: 'Keep it safe',
  },
  {
    title: 'Bro really clicked delete...',
    message: 'No take-backsies! This item is about to log off permanently.',
    confirmText: 'Nuke it',
    cancelText: 'Cancel immediately',
  },
];

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  // Pick a fresh random Gen-Z text every time the modal is opened
  const randomPreset = useMemo(() => {
    const idx = Math.floor(Math.random() * GENZ_DELETE_PRESETS.length);
    return GENZ_DELETE_PRESETS[idx];
  }, [isOpen, options]);

  if (!options) return null;

  const title = options.title || randomPreset.title;
  const message = options.message || randomPreset.message;
  const confirmText = options.confirmText || randomPreset.confirmText;
  const cancelText = options.cancelText || randomPreset.cancelText;

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
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border z-10"
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
                className="p-1 rounded-lg text-zinc-500 hover:text-white pressable transition-colors"
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

            {/* Actions: Yep vs Nope */}
            <div className="flex items-center gap-2.5 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white border pressable transition-colors"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-card)',
                }}
              >
                {cancelText}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg pressable transition-opacity bg-rose-600 hover:bg-rose-500"
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
