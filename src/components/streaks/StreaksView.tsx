import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Shield,
  Trophy,
  Award,
  Zap,
  Crown,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StreakHeatmap } from '../habits/StreakHeatmap';
import { feedback } from '../../utils/feedback';

interface StreaksViewProps {
  onClose?: () => void;
}

export const StreaksView: React.FC<StreaksViewProps> = ({ onClose }) => {
  const { habits, habitLogs, setActiveTab, getHabitStreak } = useApp();

  const [activeSection, setActiveSection] = useState<'pure' | 'lab'>('pure');
  const [freezeShields, setFreezeShields] = useState(2);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);

  const habitStreaks = habits.map((h) => ({
    ...h,
    streak: getHabitStreak(h.id),
  }));

  const maxStreak = habitStreaks.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalCheckIns = habitLogs.filter((l) => l.completed).length;

  // Determine Hall of Fame Rank
  const getRank = (streak: number) => {
    if (streak >= 60)
      return { title: 'Diamond Titan', tier: 'Diamond', color: '#38bdf8', icon: '💎', nextThreshold: 100 };
    if (streak >= 21)
      return { title: 'Gold Champion', tier: 'Gold', color: '#e5a42f', icon: '🥇', nextThreshold: 60 };
    if (streak >= 7)
      return { title: 'Silver Striker', tier: 'Silver', color: '#94a3b8', icon: '🥈', nextThreshold: 21 };
    return { title: 'Bronze Pioneer', tier: 'Bronze', color: '#f26a36', icon: '🥉', nextThreshold: 7 };
  };

  const currentRank = getRank(maxStreak);
  const rankProgress = Math.min(100, Math.round((maxStreak / currentRank.nextThreshold) * 100));

  const handleUseShield = () => {
    if (freezeShields <= 0) return;
    feedback.playSuccessChime();
    setFreezeShields((prev) => prev - 1);
    setShieldNotice('Streak Freeze Shield activated! Today is protected.');
    setTimeout(() => setShieldNotice(null), 3000);
  };

  const milestones = [
    { title: '7-Day Ignition', days: 7, desc: 'Ignite atomic momentum with a 7-day run', icon: Award, unlocked: maxStreak >= 7 },
    { title: '21-Day Habit Loop', days: 21, desc: 'Lock routine into neuroplastic habituation', icon: Trophy, unlocked: maxStreak >= 21 },
    { title: '50-Day Momentum Titan', days: 50, desc: 'Unshakable discipline sustained over half a century', icon: Zap, unlocked: maxStreak >= 50 },
    { title: '100-Day Centurion', days: 100, desc: 'Elite consistency hall of fame induction', icon: Crown, unlocked: maxStreak >= 100 },
  ];

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveTab('today');
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-64 sm:pb-56 select-none relative z-10 min-h-[calc(100vh-100px)]">
      {/* Top Bar: Back Action & Section Tabs */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white pressable transition-colors border border-white/6"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {/* Horizontal Section Switcher */}
        <div className="segmented-track flex items-center gap-1 p-1">
          <button
            type="button"
            onClick={() => {
              feedback.playClick();
              setActiveSection('pure');
            }}
            className={`px-3.5 py-1 text-xs font-bold rounded-lg pressable transition-all flex items-center gap-1.5 ${
              activeSection === 'pure'
                ? 'segmented-thumb-active text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={{
              backgroundColor: activeSection === 'pure' ? 'var(--accent-primary)' : undefined,
              color: activeSection === 'pure' ? '#ffffff' : undefined,
            }}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Pure Streak</span>
          </button>

          <button
            type="button"
            onClick={() => {
              feedback.playClick();
              setActiveSection('lab');
            }}
            className={`px-3.5 py-1 text-xs font-bold rounded-lg pressable transition-all flex items-center gap-1.5 ${
              activeSection === 'lab'
                ? 'segmented-thumb-active text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={{
              backgroundColor: activeSection === 'lab' ? 'var(--accent-primary)' : undefined,
              color: activeSection === 'lab' ? '#ffffff' : undefined,
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Lab & Heatmap</span>
          </button>
        </div>
      </div>

      {/* Main Horizontally Switchable / Swipeable Sections */}
      <div className="relative overflow-hidden w-full flex-1">
        <AnimatePresence mode="wait">
          {activeSection === 'pure' ? (
            /* ========================================================
               SECTION 1: UNREAL GRAPHICS PURE STREAK
               ======================================================== */
            <motion.div
              key="pure-section"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="solid-card p-6 sm:p-12 min-h-[480px] flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
            >
              {/* Concentric Kinetic Pulsing Flame Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-3xl"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
                <motion.div
                  animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.1, 0.25, 0.1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-96 sm:w-[480px] h-96 sm:h-[480px] rounded-full blur-[100px]"
                  style={{ backgroundColor: 'var(--accent-secondary)' }}
                />
              </div>

              {/* Status Pill */}
              <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full border bg-black/40 backdrop-blur-md">
                <Flame className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-white">
                  ACTIVE MOMENTUM
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-xs font-mono text-zinc-300">
                  {currentRank.title}
                </span>
              </div>

              {/* Monumental Streak Numeral & Radiant Core */}
              <div className="relative z-10 flex flex-col items-center my-auto py-8">
                {/* 3D Crest Badge */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border border-white/20 mb-4"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {currentRank.icon}
                </motion.div>

                {/* Monumental Number */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="relative flex items-center justify-center"
                >
                  <span
                    className="font-display text-8xl sm:text-9xl font-black tracking-tight select-none"
                    style={{
                      color: '#ffffff',
                      textShadow: '0 0 60px rgba(242, 106, 54, 0.5), 0 0 100px rgba(229, 164, 47, 0.3)',
                    }}
                  >
                    {maxStreak}
                  </span>
                </motion.div>

                <span className="font-display text-lg sm:text-xl font-bold tracking-wider text-zinc-300 uppercase mt-2">
                  Days Unbroken Run
                </span>
                <span className="font-mono text-xs text-zinc-500 mt-1">
                  {totalCheckIns} Total Life Routines Recorded
                </span>
              </div>

              {/* Bottom Quick Swipe Action */}
              <div className="relative z-10 w-full flex items-center justify-between pt-4 hairline-t">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>{freezeShields} Freeze Shields Available</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setActiveSection('lab');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white pressable shadow-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>Lab & Heatmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* ========================================================
               SECTION 2: CONSISTENCY LAB, HEATMAP, RANK & SHIELDS
               ======================================================== */
            <motion.div
              key="lab-section"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex flex-col gap-5 w-full"
            >
              {/* Notice Banner */}
              {shieldNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{shieldNotice}</span>
                </motion.div>
              )}

              {/* Bento Grid: Rank Progress (7 cols) + Freeze Shield (5 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Tier Progression Hero Card (7 cols) */}
                <div
                  className="md:col-span-7 solid-card p-5 sm:p-6 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                      <span className="font-display text-sm font-bold text-white">
                        Tier Momentum Progress
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {maxStreak} / {currentRank.nextThreshold} Days
                    </span>
                  </div>

                  <div className="my-5 flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-5xl sm:text-6xl font-black text-white tracking-tight">
                        {maxStreak}
                      </span>
                      <span className="text-sm font-mono text-zinc-400">Day Record Run</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/8 text-xs font-mono text-zinc-300">
                      {totalCheckIns} Total Logs
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-mono">
                      <span>Progress to {currentRank.tier === 'Diamond' ? 'Maximum' : 'next tier'}</span>
                      <span className="font-bold text-white">{rankProgress}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rankProgress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Freeze Shield Power-Up Card (5 cols) */}
                <div
                  className="md:col-span-5 solid-card p-5 sm:p-6 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sky-400" />
                      <span className="font-display text-sm font-bold text-white">
                        Streak Freeze Shield
                      </span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
                      {freezeShields} available
                    </span>
                  </div>

                  <div className="my-4">
                    <p className="text-xs text-zinc-400 leading-relaxed font-body">
                      Shield your consistency. If you miss a routine day, an active shield prevents streak reset.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={freezeShields <= 0}
                    onClick={handleUseShield}
                    className="w-full py-2.5 rounded-xl font-bold text-xs pressable transition-all flex items-center justify-center gap-2 disabled:opacity-30 border"
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      borderColor: 'rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{freezeShields > 0 ? 'Activate Shield For Today' : 'No Shields Left'}</span>
                  </button>
                </div>
              </div>

              {/* 14-Week GitHub Style Heatmap Grid */}
              <div className="solid-card p-4 sm:p-5" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-white">
                      14-Week Consistency History
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">98 Days</span>
                  </div>
                </div>

                <StreakHeatmap
                  habitLogs={habitLogs}
                  habitTitle="All Active Habits"
                  accentColor="var(--accent-primary)"
                />
              </div>

              {/* Milestone Achievements Grid */}
              <div className="solid-card p-5 sm:p-6 flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-white">
                    Milestone Badges
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {milestones.filter((m) => m.unlocked).length} / {milestones.length} Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {milestones.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.days}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                          m.unlocked
                            ? 'bg-white/[0.04] border-white/12'
                            : 'bg-black/20 border-white/5 opacity-40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border"
                            style={{
                              backgroundColor: m.unlocked ? 'rgba(242, 106, 54, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: m.unlocked ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              borderColor: m.unlocked ? 'rgba(242, 106, 54, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {m.unlocked && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              UNLOCKED
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-display font-bold text-xs text-white block">
                            {m.title}
                          </span>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight font-body">
                            {m.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
