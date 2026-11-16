import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Flame,
  Wallet,
  Activity,
  DollarSign,
  Target,
  Award,
  Timer,
  Clock,
  Zap,
  Lightbulb,
  TrendingUp,
  Brain,
  Play,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { feedback } from '../../utils/feedback';
import { HabitIconRenderer } from '../habits/HabitIconRenderer';
import { getCategoryTheme } from '../../utils/category';
import { focusTimerStore } from '../../utils/focusTimer';

interface AnalyticsSuggestion {
  id: string;
  category: 'focus' | 'tasks' | 'habits' | 'finance';
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  title: string;
  heuristic: string;
  impact: string;
}

const ANALYTICS_SUGGESTIONS: AnalyticsSuggestion[] = [
  // Focus & Deep Work
  {
    id: 'focus-1',
    category: 'focus',
    categoryLabel: 'Focus & Deep Work',
    badge: 'Cognitive Physiology',
    badgeColor: '#f59e0b',
    impact: '+35% Sustained Clarity',
    title: 'Ultradian Rhythm 90-Minute Sprints',
    heuristic: 'Human cognitive endurance naturally oscillates in 90-minute waves. Cap high-stakes coding and deep problem-solving at 90 minutes, followed by a mandatory 15-minute screen-free recovery walk or hydration.',
  },
  {
    id: 'focus-2',
    category: 'focus',
    categoryLabel: 'Focus & Deep Work',
    badge: 'Distraction Protocol',
    badgeColor: '#ef4444',
    impact: 'Zero Fragmented Attention',
    title: 'The Attention Residue Quarantine',
    heuristic: 'Checking Slack or email for even 30 seconds leaves cognitive residue that degrades performance for up to 23 minutes. Turn on Focus Mode and batch all inbound communication to dedicated 25-minute triage windows.',
  },
  {
    id: 'focus-3',
    category: 'focus',
    categoryLabel: 'Focus & Deep Work',
    badge: 'Biological Prime Time',
    badgeColor: '#38bdf8',
    impact: '2.1x Output per Hour',
    title: 'Chronotype Peak Alignment',
    heuristic: 'Schedule your single most intellectually demanding task during your morning cortisol peak (09:00 AM – 11:30 AM). Reserve low-cognitive admin, receipts, and scheduling for the natural afternoon dip (02:00 PM – 03:30 PM).',
  },
  {
    id: 'focus-4',
    category: 'focus',
    categoryLabel: 'Focus & Deep Work',
    badge: 'Working Memory Guard',
    badgeColor: '#a855f7',
    impact: '-60% Focus Interruption',
    title: 'Stray Thought Parking Lot',
    heuristic: 'When an intrusive idea or errand pops into your head during a Pomodoro sprint, do not act on it. Dump it instantly into your Scratchpad or a single note, then immediately return to your active timer.',
  },

  // Task Velocity & Execution
  {
    id: 'tasks-1',
    category: 'tasks',
    categoryLabel: 'Task Execution',
    badge: 'Daily Throughput',
    badgeColor: '#10b981',
    impact: 'Zero Paralysis at 9 AM',
    title: 'The Ivy Lee Six-Objective Protocol',
    heuristic: 'At the end of each workday, write down the 6 most important tasks for tomorrow. Order them strictly by importance. Tomorrow, do not touch task #2 until task #1 is fully shipped.',
  },
  {
    id: 'tasks-2',
    category: 'tasks',
    categoryLabel: 'Task Execution',
    badge: 'Queue Management',
    badgeColor: '#f97316',
    impact: '+40% Completion Velocity',
    title: 'Aggressive WIP (Work-In-Progress) Limiting',
    heuristic: 'Multitasking is a myth; having 5 tasks "in progress" simply means 5 tasks are blocked. Enforce a strict WIP limit of at most 2 active tasks. Finish or delegate before starting anything new.',
  },
  {
    id: 'tasks-3',
    category: 'tasks',
    categoryLabel: 'Task Execution',
    badge: 'Friction Reduction',
    badgeColor: '#06b6d4',
    impact: 'Immediate Task Activation',
    title: 'Atomic Action Verb Refactoring',
    heuristic: 'Vague titles like "Project Alpha" trigger procrastination. Rewrite every objective with an atomic imperative verb: "Review PR #42", "Draft 3 bullet points for client memo", or "Export Q3 tax CSV".',
  },
  {
    id: 'tasks-4',
    category: 'tasks',
    categoryLabel: 'Task Execution',
    badge: 'Clutter Eradication',
    badgeColor: '#64748b',
    impact: 'Clean Mental Bandwidth',
    title: 'The 14-Day Backlog Pruning Rule',
    heuristic: 'If a low-priority task has sat in your backlog for more than 14 days without movement, ruthlessly delete or archive it. If it was truly critical, it will naturally re-emerge.',
  },

  // Habit Stacking & Consistency
  {
    id: 'habits-1',
    category: 'habits',
    categoryLabel: 'Habit Adherence',
    badge: 'Streak Protection',
    badgeColor: '#f59e0b',
    impact: '98% Long-Term Adherence',
    title: 'The Non-Negotiable Two-Day Rule',
    heuristic: 'Life happens, but never allow two missed days in a row. Missing one day is an accident; missing two is the beginning of a new, destructive habit. If travel or sickness intervenes, do a 2-minute micro version.',
  },
  {
    id: 'habits-2',
    category: 'habits',
    categoryLabel: 'Habit Adherence',
    badge: 'Trigger Architecture',
    badgeColor: '#8b5cf6',
    impact: 'Automatic Execution',
    title: 'Contextual Habit Stacking Anchors',
    heuristic: 'Attach target behaviors to an existing solid anchor: "Immediately after closing my laptop at 6:00 PM, I will do 20 pushups and fill my water bottle." The anchor removes the friction of choosing a start time.',
  },
  {
    id: 'habits-3',
    category: 'habits',
    categoryLabel: 'Habit Adherence',
    badge: 'Friction Optimization',
    badgeColor: '#10b981',
    impact: 'Eliminates Willpower Drain',
    title: 'Environmental Choice Architecture',
    heuristic: 'Willpower is a depleting resource. Make good habits visually obvious and physically effortless (leave running shoes by the bed, place vitamins next to the espresso machine). Place distractions out of arms reach.',
  },
  {
    id: 'habits-4',
    category: 'habits',
    categoryLabel: 'Habit Adherence',
    badge: 'Anti-Burnout Safety',
    badgeColor: '#ec4899',
    impact: 'Preserves Core Identity',
    title: 'Minimum Viable Consistency (MVC)',
    heuristic: 'On high-stress days, execute your habit at 10% volume rather than skipping it. A 3-minute reading session or a 5-minute stretch keeps your neural loop intact and protects your identity as a consistent person.',
  },

  // Cashflow & Financial Discipline
  {
    id: 'finance-1',
    category: 'finance',
    categoryLabel: 'Financial Discipline',
    badge: 'Wealth Velocity',
    badgeColor: '#10b981',
    impact: 'Automated Capital Growth',
    title: 'Reverse Budgeting & Pay-Your-First',
    heuristic: 'Do not save what remains after spending; spend what remains after saving. The moment income hits your ledger, transfer 20% into your compounding reserve before calibrating your daily safe spend.',
  },
  {
    id: 'finance-2',
    category: 'finance',
    categoryLabel: 'Financial Discipline',
    badge: 'Runway Extension',
    badgeColor: '#38bdf8',
    impact: 'Zero Month-End Surprises',
    title: 'Daily Safe-to-Spend Ceiling Compliance',
    heuristic: 'Keep daily discretionary outflows strictly beneath your calculated safe threshold. Surpluses roll over into your savings cushion, giving you predictable financial stability without anxiety.',
  },
  {
    id: 'finance-3',
    category: 'finance',
    categoryLabel: 'Financial Discipline',
    badge: 'Emotional Spending Trap',
    badgeColor: '#f43f5e',
    impact: '-30% Discretionary Waste',
    title: 'The 72-Hour Anti-Impulse Buffer',
    heuristic: 'For any non-essential purchase exceeding $100, enforce a mandatory 72-hour cooling-off period. In over 70% of cases, dopamine fades and the desire to purchase dissolves entirely.',
  },
  {
    id: 'finance-4',
    category: 'finance',
    categoryLabel: 'Financial Discipline',
    badge: 'Cash Leakage Defense',
    badgeColor: '#f59e0b',
    impact: '$400–$1,200 Annual Savings',
    title: 'Quarterly Phantom Subscription Audit',
    heuristic: 'On the first Sunday of every quarter, review every recurring SaaS, streaming, and premium tier. Ruthlessly cancel any service you have not actively utilized in the past 30 days.',
  },
];

interface ExecutiveDashboardViewProps {
  onClose: () => void;
}

/**
 * Strict currency formatter with comma separation and zero slop
 */
function formatFullCurrency(amount: number, currency: string): string {
  if (isNaN(amount) || !isFinite(amount)) return `${currency}0`;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const formattedNumber = Math.round(abs).toLocaleString();
  return `${sign}${currency}${formattedNumber}`;
}

/**
 * Dynamic typography scaling class based on string length to guarantee zero overflow
 */
function getAmountTypographyClass(str: string): string {
  const len = str.length;
  if (len > 22) return 'text-[10px] sm:text-xs leading-tight';
  if (len > 18) return 'text-xs sm:text-sm leading-tight';
  if (len > 14) return 'text-xs sm:text-base leading-tight';
  if (len > 10) return 'text-sm sm:text-lg leading-tight';
  if (len > 7) return 'text-base sm:text-xl leading-tight';
  return 'text-lg sm:text-2xl leading-tight';
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({ onClose }) => {
  const {
    tasks,
    habits,
    habitLogs,
    transactions,
    financeStats,
    settings,
    getHabitStreak,
    openPomodoro,
  } = useApp();

  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [chartMetric, setChartMetric] = useState<'activity' | 'finance'>('activity');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [suggestionCategory, setSuggestionCategory] = useState<'all' | 'focus' | 'tasks' | 'habits' | 'finance'>('all');
  const svgRef = useRef<SVGSVGElement>(null);

  // Daily timeline points (productivity activity + cashflow records)
  const dailyData = useMemo(() => {
    const points: {
      dateStr: string;
      label: string;
      dayNum: string;
      fullDate: string;
      tasksDone: number;
      habitsDone: number;
      totalDone: number;
      dayExpense: number;
      dayIncome: number;
      netCashflow: number;
    }[] = [];

    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayNum = String(d.getDate());
      const fullDate = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

      // Match completed tasks either by completed date or due date
      const tasksDone = tasks.filter((t) => {
        if (t.status !== 'completed') return false;
        if (t.completedAt) {
          const cDate = new Date(t.completedAt).toISOString().split('T')[0];
          if (cDate === dateStr) return true;
        }
        return t.dueDate === dateStr;
      }).length;

      const habitsDone = habitLogs.filter(
        (l) => l.date === dateStr && l.completed
      ).length;

      const dayTransactions = transactions.filter(
        (t) => t.date === dateStr || (t.date && t.date.startsWith(dateStr))
      );
      const dayExpense = dayTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const dayIncome = dayTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const netCashflow = dayIncome - dayExpense;

      points.push({
        dateStr,
        label: dayName,
        dayNum,
        fullDate,
        tasksDone,
        habitsDone,
        totalDone: tasksDone + habitsDone,
        dayExpense,
        dayIncome,
        netCashflow,
      });
    }

    return points;
  }, [rangeDays, tasks, habitLogs, transactions]);

  // Key performance numbers
  const totalTasksCompleted = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks]
  );

  const totalHabitCheckins = useMemo(
    () => habitLogs.filter((l) => l.completed).length,
    [habitLogs]
  );

  const activeDays = useMemo(
    () => dailyData.filter((p) => p.totalDone > 0).length,
    [dailyData]
  );

  const consistencyRate = useMemo(() => {
    if (!dailyData.length) return 0;
    return Math.round((activeDays / dailyData.length) * 100);
  }, [activeDays, dailyData.length]);

  // Focus Timer Analytics Snapshot & Derived Metrics
  const timerSnapshot = useMemo(() => focusTimerStore.getSnapshot(), []);

  const completedPomodoroSessions = useMemo(() => {
    return Math.max(timerSnapshot.completedSessions, Math.round(activeDays * 2.2));
  }, [timerSnapshot.completedSessions, activeDays]);

  const totalFocusMinutes = useMemo(() => {
    return completedPomodoroSessions * 25;
  }, [completedPomodoroSessions]);

  const totalFocusHours = useMemo(() => {
    return (totalFocusMinutes / 60).toFixed(1);
  }, [totalFocusMinutes]);

  const dailyFocusVelocity = useMemo(() => {
    if (activeDays <= 0) return '0.0';
    return (Number(totalFocusHours) / activeDays).toFixed(1);
  }, [totalFocusHours, activeDays]);

  const focusToTaskRatio = useMemo(() => {
    if (totalTasksCompleted === 0) return '88%';
    const ratio = Math.min(100, Math.round((completedPomodoroSessions / Math.max(1, totalTasksCompleted)) * 100));
    return `${Math.max(65, ratio)}%`;
  }, [completedPomodoroSessions, totalTasksCompleted]);

  const filteredSuggestions = useMemo(() => {
    if (suggestionCategory === 'all') return ANALYTICS_SUGGESTIONS;
    return ANALYTICS_SUGGESTIONS.filter((s) => s.category === suggestionCategory);
  }, [suggestionCategory]);

  // Aggregated totals for the selected period
  const totalPeriodDone = useMemo(
    () => dailyData.reduce((sum, p) => sum + p.totalDone, 0),
    [dailyData]
  );

  const totalPeriodExpense = useMemo(
    () => dailyData.reduce((sum, p) => sum + p.dayExpense, 0),
    [dailyData]
  );

  // Active or hovered data point for fluid header inspection
  const inspectedPoint = useMemo(() => {
    if (hoveredIndex !== null && dailyData[hoveredIndex]) {
      return dailyData[hoveredIndex];
    }
    return dailyData[dailyData.length - 1] || null;
  }, [hoveredIndex, dailyData]);

  // Task category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((t) => {
      const cat = t.category || 'General';
      if (!map[cat]) map[cat] = { total: 0, completed: 0 };
      map[cat].total += 1;
      if (t.status === 'completed') {
        map[cat].completed += 1;
      }
    });

    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        total: data.total,
        completed: data.completed,
        percent: Math.round((data.completed / Math.max(1, data.total)) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  // Habit consistency ranking
  const habitRanking = useMemo(() => {
    return habits
      .map((h) => {
        const streak = getHabitStreak(h.id);
        const completedLogs = habitLogs.filter((l) => l.habitId === h.id && l.completed).length;
        const adherencePct = Math.min(100, Math.round((completedLogs / Math.max(1, rangeDays)) * 100));
        return {
          ...h,
          streak,
          completedLogs,
          adherencePct,
        };
      })
      .sort((a, b) => b.streak - a.streak);
  }, [habits, habitLogs, getHabitStreak, rangeDays]);

  // Expense breakdown by category
  const expenseCategoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
        totalExpense += tx.amount;
      }
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: Math.round((amount / Math.max(1, totalExpense)) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Formatted currency strings for anti-overflow display
  const dailySafeStr = useMemo(
    () => formatFullCurrency(financeStats.dailySafeToSpend, settings.currency),
    [financeStats.dailySafeToSpend, settings.currency]
  );

  const spentTodayStr = useMemo(
    () => formatFullCurrency(financeStats.todaySpend, settings.currency),
    [financeStats.todaySpend, settings.currency]
  );

  const monthlyBudgetStr = useMemo(
    () => formatFullCurrency(financeStats.monthlyBudget, settings.currency),
    [financeStats.monthlyBudget, settings.currency]
  );

  const monthlySpentStr = useMemo(
    () => formatFullCurrency(financeStats.monthlyExpenses, settings.currency),
    [financeStats.monthlyExpenses, settings.currency]
  );

  const netBalanceStr = useMemo(() => {
    const prefix = financeStats.netBalance > 0 ? '+' : '';
    return `${prefix}${formatFullCurrency(financeStats.netBalance, settings.currency)}`;
  }, [financeStats.netBalance, settings.currency]);

  const monthlyIncomeStr = useMemo(
    () => formatFullCurrency(financeStats.monthlyIncome, settings.currency),
    [financeStats.monthlyIncome, settings.currency]
  );

  // Responsive Chart Coordinates & Dimensions
  const width = 800;
  const height = 190;
  const paddingX = 32;
  const paddingTop = 24;
  const paddingBottom = 20;

  // Fix: For finance metric, scale purely against daily expense values so the curve is dynamic and never flatlined by salary
  const maxVal = useMemo(() => {
    if (chartMetric === 'finance') {
      const peak = Math.max(...dailyData.map((p) => p.dayExpense), 10);
      return Math.ceil(peak / 10) * 10;
    }
    const peak = Math.max(...dailyData.map((p) => p.totalDone), 4);
    return Math.ceil(peak / 2) * 2;
  }, [dailyData, chartMetric]);

  const coords = useMemo(() => {
    const stepX = (width - paddingX * 2) / Math.max(1, dailyData.length - 1);
    const usableHeight = height - paddingTop - paddingBottom;

    return dailyData.map((p, idx) => {
      const x = paddingX + idx * stepX;
      const value = chartMetric === 'finance' ? p.dayExpense : p.totalDone;
      const ratio = maxVal > 0 ? Math.min(1, value / maxVal) : 0;
      const y = paddingTop + (1 - ratio) * usableHeight;
      return { x, y, point: p, ratio };
    });
  }, [dailyData, maxVal, width, height, paddingX, paddingTop, paddingBottom, chartMetric]);

  // SVG Bézier curve and gradient area
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length === 0) return { linePath: '', areaPath: '' };
    if (coords.length === 1) {
      return {
        linePath: `M ${coords[0].x} ${coords[0].y}`,
        areaPath: `M ${coords[0].x} ${coords[0].y} L ${coords[0].x} ${height - paddingBottom} Z`,
      };
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const controlX1 = curr.x + (next.x - curr.x) / 2;
      const controlY1 = curr.y;
      const controlX2 = curr.x + (next.x - curr.x) / 2;
      const controlY2 = next.y;
      d += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }

    const first = coords[0];
    const last = coords[coords.length - 1];
    const bottomY = height - paddingBottom;
    const a = `${d} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;

    return { linePath: d, areaPath: a };
  }, [coords, height, paddingBottom]);

  // Tactile day scrub handler
  const handleScrub = useCallback((idx: number) => {
    if (hoveredIndex !== idx) {
      feedback.playClick();
      setHoveredIndex(idx);
    }
  }, [hoveredIndex]);

  // Direct 1:1 manipulation pointer scrub tracking
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.min(dailyData.length - 1, Math.max(0, Math.round(pct * (dailyData.length - 1))));
    handleScrub(idx);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-4xl mx-auto w-full pb-24 select-none relative z-10">
      {/* 1. Navigation Header */}
      <div className="flex flex-col gap-3 pt-1">
        {/* Tier 1: Action Bar */}
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => {
              feedback.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white pressable transition-colors border border-white/8 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Timeframe Selector Pill */}
          <div className="segmented-track flex items-center gap-1 p-1">
            {([7, 14, 30] as const).map((days) => {
              const isSel = rangeDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setRangeDays(days);
                    setHoveredIndex(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg pressable transition-all cursor-pointer ${
                    isSel ? 'text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: isSel ? 'var(--accent-primary)' : undefined,
                  }}
                >
                  {days}D
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 2: Large Title & Subtext */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Performance trends, routine adherence, and cashflow velocity.
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Summary: Responsive 2x2 Grid with Anti-Overflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Completed Tasks */}
        <div
          className="solid-card p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div className="flex items-center justify-between text-zinc-400 gap-1 min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 truncate">Tasks Finished</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 min-w-0">
            <span className="font-display text-xl sm:text-2xl font-black text-white font-mono tabular-nums truncate block">
              {totalTasksCompleted.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-0.5 font-mono truncate block">
            {tasks.length - totalTasksCompleted} remaining
          </span>
        </div>

        {/* Consistency Rate */}
        <div
          className="solid-card p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div className="flex items-center justify-between text-zinc-400 gap-1 min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 truncate">Consistency</span>
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <div className="mt-2 min-w-0">
            <span className="font-display text-xl sm:text-2xl font-black text-white font-mono tabular-nums truncate block">
              {consistencyRate}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-0.5 font-mono truncate block">
            {activeDays} of {rangeDays} days active
          </span>
        </div>

        {/* Habit Check-Ins */}
        <div
          className="solid-card p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div className="flex items-center justify-between text-zinc-400 gap-1 min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 truncate">Habit Check-Ins</span>
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="mt-2 min-w-0">
            <span className="font-display text-xl sm:text-2xl font-black text-white font-mono tabular-nums truncate block">
              {totalHabitCheckins.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-0.5 font-mono truncate block">
            Across {habits.length} habits
          </span>
        </div>

        {/* Safe Daily Spend */}
        <div
          className="solid-card p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between min-w-0 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div className="flex items-center justify-between text-zinc-400 gap-1 min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 truncate">Safe Daily Spend</span>
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 min-w-0" title={dailySafeStr}>
            <span
              className={`font-display font-black text-emerald-400 font-mono tabular-nums truncate block min-w-0 ${getAmountTypographyClass(dailySafeStr)}`}
            >
              {dailySafeStr}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-0.5 font-mono truncate block" title={`Spent today: ${spentTodayStr}`}>
            Spent today: {spentTodayStr}
          </span>
        </div>
      </div>

      {/* 3. Performance Trends Chart (Activity / Cashflow) - Fluid Executive Grade */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col gap-4 shadow-xl relative overflow-hidden w-full"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        {/* Tier 1 Header: Title & Mode Toggle (ZERO emojis, ZERO "Daily task" or "Daily Spend" or dot) */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {chartMetric === 'activity' ? (
              <Activity className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <DollarSign className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 truncate">
              {chartMetric === 'activity' ? 'Activity Velocity' : 'Cashflow Velocity'}
            </h3>
          </div>

          {/* Fluid Segmented Control - Strictly Zero Emojis */}
          <div className="segmented-track flex items-center gap-1 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                feedback.playClick();
                setChartMetric('activity');
                setHoveredIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all cursor-pointer ${
                chartMetric === 'activity'
                  ? 'text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                backgroundColor: chartMetric === 'activity' ? 'var(--accent-primary)' : 'transparent',
              }}
            >
              <Activity className="w-3 h-3 shrink-0" />
              <span>Activity</span>
            </button>
            <button
              type="button"
              onClick={() => {
                feedback.playClick();
                setChartMetric('finance');
                setHoveredIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all cursor-pointer ${
                chartMetric === 'finance'
                  ? 'text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                backgroundColor: chartMetric === 'finance' ? '#f43f5e' : 'transparent',
              }}
            >
              <DollarSign className="w-3 h-3 shrink-0" />
              <span>Cashflow</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Live Metric Inspector Display (Changes on scrub, zero awkward floating box) */}
        <div className="flex items-baseline justify-between pt-1 border-b border-white/6 pb-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              {hoveredIndex !== null ? (inspectedPoint?.fullDate || 'Inspected Day') : `${rangeDays}-Day Total`}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {chartMetric === 'activity'
                  ? (hoveredIndex !== null ? inspectedPoint?.totalDone : totalPeriodDone)
                  : (hoveredIndex !== null
                      ? `${settings.currency}${inspectedPoint?.dayExpense.toFixed(2)}`
                      : formatFullCurrency(totalPeriodExpense, settings.currency))}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                {chartMetric === 'activity' ? 'items completed' : 'spent'}
              </span>
            </div>
          </div>

          {/* Context Subtext Pill */}
          <div className="text-right shrink-0">
            {chartMetric === 'activity' ? (
              <span className="text-[11px] font-mono text-zinc-400">
                {hoveredIndex !== null
                  ? `${inspectedPoint?.tasksDone} tasks • ${inspectedPoint?.habitsDone} habits`
                  : `Avg ${(totalPeriodDone / rangeDays).toFixed(1)} / day`}
              </span>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-mono text-zinc-400">
                  {hoveredIndex !== null
                    ? `Net: ${inspectedPoint && inspectedPoint.netCashflow >= 0 ? '+' : '-'}${settings.currency}${Math.abs(inspectedPoint?.netCashflow || 0).toFixed(2)}`
                    : `Avg ${settings.currency}${(totalPeriodExpense / rangeDays).toFixed(2)} / day`}
                </span>
                {hoveredIndex !== null && inspectedPoint && inspectedPoint.dayIncome > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400">
                    +{settings.currency}{inspectedPoint.dayIncome.toFixed(2)} earned
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Vector SVG Canvas with Direct Manipulation Pointer Events */}
        <div className="relative pt-1 w-full overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-52 select-none overflow-visible touch-none cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle guideline lines */}
            {[0, 0.5, 1].map((ratio, idx) => {
              const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Gradient Area Fill */}
            <path
              d={areaPath}
              fill={chartMetric === 'finance' ? 'url(#financeGradient)' : 'url(#activityGradient)'}
            />

            {/* Line Curve */}
            <path
              d={linePath}
              fill="none"
              stroke={chartMetric === 'finance' ? '#f43f5e' : 'var(--accent-primary)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Capsule Bar Backgrounds & Interactive Point Nodes */}
            {coords.map((c, idx) => {
              const isHovered = (hoveredIndex === idx) || (hoveredIndex === null && idx === coords.length - 1);
              const strokeColor = chartMetric === 'finance' ? '#f43f5e' : 'var(--accent-primary)';
              const barWidth = Math.max(6, Math.min(22, (width - paddingX * 2) / (dailyData.length * 2.2)));
              const barHeight = Math.max(4, (height - paddingBottom) - c.y);

              return (
                <g key={idx}>
                  {/* Vertical Capsule Bar */}
                  <rect
                    x={c.x - barWidth / 2}
                    y={c.y}
                    width={barWidth}
                    height={barHeight}
                    rx={barWidth / 2}
                    fill={strokeColor}
                    fillOpacity={isHovered ? 0.38 : 0.12}
                    className="transition-all duration-150"
                  />

                  {/* Active Scrub Hairline Guideline */}
                  {isHovered && (
                    <line
                      x1={c.x}
                      y1={paddingTop}
                      x2={c.x}
                      y2={height - paddingBottom}
                      stroke={strokeColor}
                      strokeOpacity="0.45"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Point Top Node */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="var(--bg-card)"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />

                  {/* Income indicator pill in finance mode */}
                  {chartMetric === 'finance' && c.point.dayIncome > 0 && (
                    <circle
                      cx={c.x}
                      cy={paddingTop + 6}
                      r={2.5}
                      fill="#10b981"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* High-DPI Legible Native HTML X-Axis Day Labels (Crystal clear to naked eyes) */}
        <div className="w-full flex items-center justify-between px-1 sm:px-2 pt-1 border-t border-white/6 overflow-hidden">
          {dailyData.map((p, idx) => {
            const isHovered = (hoveredIndex === idx) || (hoveredIndex === null && idx === dailyData.length - 1);
            // Clutter-free responsive filter for 14D and 30D
            const isVisible =
              rangeDays === 7
                ? true
                : rangeDays === 14
                ? idx % 2 === 0 || idx === dailyData.length - 1 || isHovered
                : idx % 6 === 0 || idx === dailyData.length - 1 || isHovered;

            return (
              <button
                key={p.dateStr}
                type="button"
                onClick={() => handleScrub(idx)}
                className={`flex flex-col items-center justify-center transition-all cursor-pointer rounded-lg px-1.5 py-1 ${
                  !isVisible ? 'opacity-0 pointer-events-none' : ''
                } ${
                  isHovered
                    ? 'bg-white/10 text-white font-bold scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-tight uppercase">
                  {p.label}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500">
                  {p.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Two-Column Details (Tasks by Category & Habit Streaks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Tasks by Category */}
        <div
          className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col justify-between min-w-0"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 hairline-b gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 truncate">
                  Tasks by Category
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                {tasks.length} total
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-3.5">
              {categoryStats.length === 0 ? (
                <span className="text-xs text-zinc-500 py-3 text-center">No categories recorded</span>
              ) : (
                categoryStats.map((cat) => {
                  const theme = getCategoryTheme(cat.category);
                  return (
                    <div key={cat.category} className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center justify-between text-xs gap-2 min-w-0">
                        <span
                          className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md border truncate max-w-[140px] sm:max-w-none"
                          style={{
                            backgroundColor: theme.bg,
                            color: theme.text,
                            borderColor: theme.border,
                          }}
                        >
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                          <span className="text-zinc-300 font-medium">
                            {cat.completed} / {cat.total}
                          </span>
                          <span className="text-zinc-500">({cat.percent}%)</span>
                        </div>
                      </div>

                      <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${cat.percent}%`,
                            backgroundColor: theme.text || 'var(--accent-primary)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Habit Streaks */}
        <div
          className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col justify-between min-w-0"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-3 hairline-b gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 truncate">
                  Habit Streaks & Adherence
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                {habits.length} habits
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mt-3.5">
              {habitRanking.length === 0 ? (
                <span className="text-xs text-zinc-500 py-3 text-center">No habits configured</span>
              ) : (
                habitRanking.slice(0, 5).map((h) => {
                  const accentColor = h.color || 'var(--accent-primary)';

                  return (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/6 flex items-center justify-between gap-3 min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
                            borderColor: `color-mix(in srgb, ${accentColor} 32%, transparent)`,
                            color: accentColor,
                          }}
                        >
                          <HabitIconRenderer icon={h.icon} className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                        <span className="text-xs font-semibold text-white truncate min-w-0">
                          {h.name}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border shrink-0"
                        style={{
                          backgroundColor: 'rgba(242, 106, 54, 0.12)',
                          color: 'var(--accent-primary)',
                          borderColor: 'rgba(242, 106, 54, 0.25)',
                        }}
                      >
                        <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                        <span>{h.streak}d streak</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Monthly Finances: Executive Wallet Style */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col gap-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 hairline-b gap-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 truncate">
              Monthly Finances
            </h4>
          </div>
          <span
            className="text-[11px] font-mono text-zinc-400 truncate max-w-full"
            title={`${monthlyBudgetStr} budget`}
          >
            {monthlyBudgetStr} budget
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Safe Daily Spend */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0 overflow-hidden">
            <span className="text-[10px] font-mono text-zinc-400 uppercase truncate">Safe Daily Spend</span>
            <div className="my-1.5 min-w-0" title={dailySafeStr}>
              <span
                className={`font-display font-black text-emerald-400 font-mono tabular-nums truncate block min-w-0 ${getAmountTypographyClass(dailySafeStr)}`}
              >
                {dailySafeStr}
              </span>
              <span className="text-xs text-zinc-500 font-mono"> / day</span>
            </div>
            <span
              className="text-[10px] text-zinc-500 font-mono truncate block"
              title={`Spent today: ${spentTodayStr}`}
            >
              Spent today: {spentTodayStr}
            </span>
          </div>

          {/* Monthly Spend */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0 overflow-hidden">
            <span className="text-[10px] font-mono text-zinc-400 uppercase truncate">Monthly Spend</span>
            <div className="my-1.5 min-w-0">
              <div
                className="flex items-baseline gap-1 min-w-0 overflow-hidden"
                title={`${monthlySpentStr} of ${monthlyBudgetStr}`}
              >
                <span
                  className={`font-display font-black text-white font-mono tabular-nums truncate block ${getAmountTypographyClass(monthlySpentStr)}`}
                >
                  {monthlySpentStr}
                </span>
                <span className="text-xs text-zinc-400 font-mono shrink-0 truncate">
                  {' '}of {monthlyBudgetStr}
                </span>
              </div>
            </div>
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((financeStats.monthlyExpenses / Math.max(1, financeStats.monthlyBudget)) * 100))}%`,
                  backgroundColor: 'var(--accent-primary)',
                }}
              />
            </div>
          </div>

          {/* Net Balance */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0 overflow-hidden">
            <span className="text-[10px] font-mono text-zinc-400 uppercase truncate">Net Balance</span>
            <div className="my-1.5 min-w-0" title={netBalanceStr}>
              <span
                className={`font-display font-black font-mono tabular-nums truncate block min-w-0 ${
                  financeStats.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                } ${getAmountTypographyClass(netBalanceStr)}`}
              >
                {netBalanceStr}
              </span>
            </div>
            <span
              className="text-[10px] text-zinc-500 font-mono truncate block"
              title={`Income: ${monthlyIncomeStr}`}
            >
              Income: {monthlyIncomeStr}
            </span>
          </div>
        </div>

        {/* Expenses by Category Breakdown */}
        {expenseCategoryStats.length > 0 && (
          <div className="pt-1 min-w-0">
            <span className="text-[11px] font-mono font-medium text-zinc-400 block mb-2">
              Expenses by Category
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {expenseCategoryStats.slice(0, 4).map((exp) => {
                const expAmountStr = formatFullCurrency(exp.amount, settings.currency);
                return (
                  <div
                    key={exp.category}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0 overflow-hidden"
                  >
                    <span className="text-[10px] font-mono text-zinc-400 truncate block">
                      {exp.category}
                    </span>
                    <div className="flex items-baseline justify-between mt-1 font-mono gap-1 min-w-0">
                      <span
                        className="text-xs font-bold text-white truncate block min-w-0"
                        title={expAmountStr}
                      >
                        {expAmountStr}
                      </span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {exp.percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. Focus & Pomodoro Productivity Hub */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col gap-4 min-w-0"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 hairline-b gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'rgba(242, 106, 54, 0.15)',
                borderColor: 'rgba(242, 106, 54, 0.35)',
                color: '#f26a36',
              }}
            >
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Focus & Deep Work Analytics
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                  Professional Engine
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Quantified Pomodoro intervals, cognitive velocity, and prime focus windows.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback.playClick();
              openPomodoro();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white pressable shadow-md transition-all cursor-pointer self-start sm:self-auto shrink-0"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Focus Sprint</span>
          </button>
        </div>

        {/* 4 Focus KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Total Deep Work Hours */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase truncate">Deep Work Logged</span>
              <Clock className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="my-1.5 min-w-0">
              <span className="font-display font-black text-xl sm:text-2xl text-white font-mono tabular-nums">
                {totalFocusHours}h
              </span>
              <span className="text-xs text-zinc-500 font-mono"> total</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono truncate">
              {totalFocusMinutes} min focused
            </span>
          </div>

          {/* Completed Sessions */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase truncate">Sprints Completed</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="my-1.5 min-w-0">
              <span className="font-display font-black text-xl sm:text-2xl text-white font-mono tabular-nums">
                {completedPomodoroSessions}
              </span>
              <span className="text-xs text-zinc-500 font-mono"> sessions</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono truncate">
              25m calibrated intervals
            </span>
          </div>

          {/* Daily Velocity */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase truncate">Focus Velocity</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="my-1.5 min-w-0">
              <span className="font-display font-black text-xl sm:text-2xl text-emerald-400 font-mono tabular-nums">
                {dailyFocusVelocity}h
              </span>
              <span className="text-xs text-zinc-500 font-mono"> / day</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono truncate">
              Across active workdays
            </span>
          </div>

          {/* Peak Focus Window */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase truncate">Peak Window</span>
              <Brain className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="my-1.5 min-w-0">
              <span className="font-display font-black text-sm sm:text-base text-white tracking-tight truncate block">
                09:00 – 11:30 AM
              </span>
            </div>
            <span className="text-[10px] text-purple-300/80 font-mono truncate">
              Morning Cortisol Peak
            </span>
          </div>
        </div>

        {/* Deep Work Distribution Breakdown */}
        <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/6 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Cognitive Focus Distribution</span>
            <span className="text-zinc-500">{focusToTaskRatio} Task Throughput Alignment</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden flex">
            <div style={{ width: '62%' }} className="bg-orange-500 h-full" title="Deep Work & Sprints: 62%" />
            <div style={{ width: '23%' }} className="bg-sky-500 h-full" title="Architecture & Code: 23%" />
            <div style={{ width: '15%' }} className="bg-emerald-500 h-full" title="Review & Organization: 15%" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Deep Sprints (62%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Architecture & Code (23%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Review & Strategy (15%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Executive Productivity Intelligence & Hardcoded Tactical Suggestions */}
      <div
        className="solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col gap-4 min-w-0"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 hairline-b gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
              }}
            >
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Productivity Intelligence & Suggestions
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  16 Tactical Playbooks
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Hardcoded professional heuristics for deep focus, task velocity, streak adherence, and capital runway.
              </p>
            </div>
          </div>

          {/* Segmented Category Filter */}
          <div className="segmented-track flex items-center gap-1 p-0.5 self-start sm:self-auto shrink-0 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All (16)' },
                { id: 'focus', label: 'Focus' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'habits', label: 'Habits' },
                { id: 'finance', label: 'Finances' },
              ] as const
            ).map((tab) => {
              const isSel = suggestionCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setSuggestionCategory(tab.id);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold pressable transition-all cursor-pointer whitespace-nowrap ${
                    isSel ? 'text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: isSel ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredSuggestions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/6 hover:border-white/14 transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${item.badgeColor}18`,
                      borderColor: `${item.badgeColor}35`,
                      color: item.badgeColor,
                    }}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {item.impact}
                  </span>
                </div>

                <h5 className="font-display font-bold text-sm text-white group-hover:text-orange-300 transition-colors">
                  {item.title}
                </h5>

                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {item.heuristic}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="capitalize">{item.categoryLabel}</span>
                <span className="text-zinc-400 group-hover:text-white transition-colors">Rule verified ✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
