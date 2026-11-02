import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Shield,
  Trophy,
  Award,
  Zap,
  Sparkles,
  Swords,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StreakHeatmap } from '../habits/StreakHeatmap';
import { feedback } from '../../utils/feedback';

export const StreaksView: React.FC = () => {
  const { habits, habitLogs } = useApp();

  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(undefined);
  const [freezeShields, setFreezeShields] = useState(2);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);

  // Calculate streaks per habit
  const getStreak = (habitId: string): number => {
    const logs = habitLogs
      .filter((l) => l.habitId === habitId && l.completed)
      .map((l) => l.date)
      .sort()
      .reverse();

    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let checkDate = new Date();
    if (!logs.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (logs.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const habitStreaks = habits.map((h) => ({
    ...h,
    streak: getStreak(h.id),
  }));

  const maxStreak = habitStreaks.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalCheckIns = habitLogs.filter((l) => l.completed).length;

  // Determine Hall of Fame Rank
  const getRank = (streak: number) => {
    if (streak >= 60) return { title: 'Diamond Titan', tier: 'Diamond', color: '#38bdf8', icon: '💎', nextThreshold: 100 };
    if (streak >= 21) return { title: 'Gold Champion', tier: 'Gold', color: '#e5a42f', icon: '🥇', nextThreshold: 60 };
    if (streak >= 7) return { title: 'Silver Striker', tier: 'Silver', color: '#94a3b8', icon: '🥈', nextThreshold: 21 };
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
    { title: '100-Day Centurion', days: 100, desc: 'Elite consistency hall of fame induction', icon: Sparkles, unlocked: maxStreak >= 100 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-28 select-none relative z-10">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(242, 106, 54, 0.15)', color: 'var(--accent-primary)' }}
            >
              HALL OF FAME
            </span>
            <span className="text-xs text-zinc-400 font-mono">Streak Architecture</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Consistency Hall of Fame
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Forge unbreakable momentum, climb milestone tiers, and shield your daily habit streaks.
          </p>
        </div>

        {/* Current Tier Badge */}
        <div
          className="flex items-center gap-3 p-3 rounded-2xl border self-start sm:self-auto"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div className="text-2xl">{currentRank.icon}</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Current Tier</span>
            <span className="text-sm font-bold text-white font-display">{currentRank.title}</span>
          </div>
        </div>
      </div>

      {/* 2. Top Hall of Fame Bento Grid */}
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
              <span>Progress to next rank</span>
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
              <span className="font-display text-xs font-bold uppercase tracking-wider text-white">
                Freeze Shields
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400">
              {freezeShields} Available
            </span>
          </div>

          <div className="my-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Streak shields protect your streak from breaking if you miss a single day due to travel or rest.
            </p>
            {shieldNotice && (
              <span className="inline-block mt-2 text-[11px] text-emerald-400 font-mono font-bold">
                ✓ {shieldNotice}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseShield}
            disabled={freezeShields <= 0}
            className="w-full h-10 rounded-xl font-bold text-xs pressable flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: freezeShields > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: freezeShields > 0 ? '#38bdf8' : '#71717a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{freezeShields > 0 ? 'Deploy Freeze Shield' : 'No Shields Remaining'}</span>
          </button>
        </div>
      </div>

      {/* 3. Master 14-Week Heatmap */}
      <div className="solid-card p-5 border border-white/8" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="font-display text-sm font-bold text-white tracking-tight">
              Consistency Matrix
            </h3>
          </div>

          {/* Habit Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedHabitId(undefined)}
              className={`px-3 py-1 rounded-xl text-xs font-bold pressable transition-colors ${
                selectedHabitId === undefined
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white bg-white/[0.04]'
              }`}
            >
              All Habits
            </button>
            {habits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHabitId(h.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold pressable transition-colors whitespace-nowrap ${
                  selectedHabitId === h.id
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>

        <StreakHeatmap
          habitLogs={habitLogs}
          habitId={selectedHabitId}
          habitTitle={selectedHabitId ? habits.find((h) => h.id === selectedHabitId)?.name : 'All Consistency'}
          accentColor="var(--accent-primary)"
        />
      </div>

      {/* 4. Habit Momentum Duels (Comparative Habits Performance) */}
      {habitStreaks.length >= 2 && (
        <div className="solid-card p-5" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Swords className="w-4 h-4 text-amber-400" />
            <h3 className="font-display text-sm font-bold text-white tracking-tight">
              Habit Momentum Duels
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {habitStreaks.slice(0, 2).map((habit, idx) => (
              <div
                key={habit.id}
                className="p-4 rounded-2xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: idx === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)', color: '#fff' }}
                  >
                    {idx === 0 ? 'A' : 'B'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{habit.name}</h4>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Target: {habit.targetCount} {habit.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{habit.streak}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Milestone Trophy Unlocks */}
      <div className="solid-card p-5" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-display text-sm font-bold text-white tracking-tight">
              Milestone Achievements
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {milestones.filter((m) => m.unlocked).length} / {milestones.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  m.unlocked
                    ? 'border-white/20 bg-white/[0.04]'
                    : 'border-white/6 bg-white/[0.01] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: m.unlocked ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                      color: m.unlocked ? '#fff' : '#71717a',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {m.unlocked ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      UNLOCKED
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{m.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
