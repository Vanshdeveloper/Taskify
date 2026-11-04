import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dices, X, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDailyPoke, getRandomPoke, type PokeMessage } from '../../utils/pokeMessages';
import { feedback, triggerCompletionConfetti } from '../../utils/feedback';

export const DailyPokeCard: React.FC = () => {
  const { settings, tasks, habits, getHabitStreak } = useApp();

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, getHabitStreak(h.id)), 0);

  const [poke, setPoke] = useState<PokeMessage>(() =>
    getDailyPoke(settings.userName, pendingTasksCount, maxStreak)
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [pokedBack, setPokedBack] = useState(false);

  const handleRollNewPoke = () => {
    feedback.playClick();
    const newPoke = getRandomPoke(settings.userName, pendingTasksCount, maxStreak);
    setPoke(newPoke);
    setPokedBack(false);
  };

  const handlePokeBack = (e: React.MouseEvent) => {
    feedback.playSuccessChime();
    triggerCompletionConfetti(e.clientX, e.clientY);
    setPokedBack(true);
    setTimeout(() => setPokedBack(false), 2400);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="solid-card p-4 sm:p-4.5 rounded-2xl border shadow-xl relative overflow-hidden group select-none"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Glow Accent Ambient Background */}
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3 min-w-0">
            {/* Poke Emoji Bubble */}
            <motion.div
              key={poke.emoji}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-inner"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {poke.emoji}
            </motion.div>

            <div className="flex flex-col min-w-0">
              {/* Badge & Category */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{
                    backgroundColor: 'rgba(242, 106, 54, 0.15)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Daily Poke
                </span>
                {maxStreak >= 2 && (
                  <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {maxStreak}d Streak
                  </span>
                )}
              </div>

              {/* Punchy Title */}
              <h4 className="font-display font-extrabold text-xs sm:text-sm text-white tracking-tight leading-snug">
                {poke.title}
              </h4>

              {/* Witty Body Text */}
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                {poke.body}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleRollNewPoke}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Roll another poke"
            >
              <Dices className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Poke Back Nudge Bar */}
        <div className="mt-3 pt-2.5 hairline-t flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500">
            Swiggy & Zomato-grade discipline nudges
          </span>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={handlePokeBack}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold pressable transition-all cursor-pointer shadow-sm"
            style={{
              backgroundColor: pokedBack ? 'rgba(16, 185, 129, 0.2)' : 'var(--accent-primary)',
              color: pokedBack ? '#34d399' : '#ffffff',
            }}
          >
            <span>{pokedBack ? 'Poked back! 🎉' : 'Poke back 👉'}</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
