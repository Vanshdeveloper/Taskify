/**
 * Feature F14: Integrated Focus / Pomodoro Session Timer
 * Pure drift-free timestamp delta engine, state machine, and observable singleton store.
 */

export type FocusMode = 'focus' | 'shortBreak' | 'longBreak';
export type FocusTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface FocusTimerConfig {
  focusDuration: number; // in seconds (default 1500 = 25m)
  shortBreakDuration: number; // in seconds (default 300 = 5m)
  longBreakDuration: number; // in seconds (default 900 = 15m)
  sessionsBeforeLongBreak: number; // default 4
}

export const DEFAULT_FOCUS_CONFIG: FocusTimerConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
};

export const DEFAULT_POMODORO_CONFIG = DEFAULT_FOCUS_CONFIG;

export interface FocusTimerSnapshot {
  mode: FocusMode;
  status: FocusTimerStatus;
  durationSeconds: number;
  remainingSeconds: number;
  remainingMs: number;
  progress: number; // 0.0 to 1.0
  isCompleted: boolean;
  completedSessions: number;
  activeTaskId: string | null;
  isMuted: boolean;
  formattedTime: string;
}

/**
 * High-precision MM:SS time formatter
 */
export function formatTimeRemaining(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '00:00';
  }
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Apple Watch progress ring geometry math (SVG stroke-dashoffset)
 */
export function calculateRingMetrics(progress: number, radius = 54) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);
  return {
    radius,
    circumference,
    strokeDashoffset,
    percent: Math.round(clampedProgress * 100),
  };
}

export interface DriftFreeTimerParams {
  startedAt: number | null;
  accumulatedMs?: number;
  durationMs: number;
  currentTime?: number;
  status: FocusTimerStatus;
}

/**
 * Pure drift-free timestamp delta calculations
 */
export function calculateDriftFreeTimer({
  startedAt,
  accumulatedMs = 0,
  durationMs,
  currentTime = Date.now(),
  status,
}: DriftFreeTimerParams) {
  if (status === 'idle') {
    return {
      remainingMs: durationMs,
      remainingSeconds: Math.ceil(durationMs / 1000),
      elapsedMs: 0,
      progress: 0,
      isCompleted: false,
    };
  }

  let totalElapsedMs = accumulatedMs;
  if (status === 'running' && startedAt) {
    const delta = Math.max(0, currentTime - startedAt);
    totalElapsedMs += delta;
  }

  const remainingMs = Math.max(0, durationMs - totalElapsedMs);
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = durationMs > 0 ? Math.min(1, totalElapsedMs / durationMs) : 1;
  const isCompleted = remainingMs <= 0;

  return {
    remainingMs,
    remainingSeconds,
    elapsedMs: Math.min(durationMs, totalElapsedMs),
    progress,
    isCompleted,
  };
}

/**
 * Observable Store / State Machine for Focus / Pomodoro Sessions
 */
export class FocusTimerStore {
  public config: FocusTimerConfig;
  public mode: FocusMode = 'focus';
  public status: FocusTimerStatus = 'idle';
  public durationSeconds: number;
  public accumulatedMs = 0;
  public startedAt: number | null = null;
  public completedSessions = 0;
  public activeTaskId: string | null = null;
  public isMuted = false;
  public completionHistory: Array<{
    mode: FocusMode;
    completedAt: number;
    taskId: string | null;
    sessionNumber: number;
  }> = [];

  private listeners = new Set<(snapshot: FocusTimerSnapshot, event?: string, payload?: any) => void>();
  private intervalId: any = null;

  constructor(config: Partial<FocusTimerConfig> = {}) {
    this.config = { ...DEFAULT_FOCUS_CONFIG, ...config };
    this.durationSeconds = this.config.focusDuration;
  }

  public getDurationForMode(mode: FocusMode): number {
    switch (mode) {
      case 'shortBreak':
        return this.config.shortBreakDuration;
      case 'longBreak':
        return this.config.longBreakDuration;
      case 'focus':
      default:
        return this.config.focusDuration;
    }
  }

  public getSnapshot = (now = Date.now()): FocusTimerSnapshot => {
    return this.getState(now);
  };

  public getState = (now = Date.now()): FocusTimerSnapshot => {
    const durationMs = this.durationSeconds * 1000;
    const calc = calculateDriftFreeTimer({
      startedAt: this.startedAt,
      accumulatedMs: this.accumulatedMs,
      durationMs,
      currentTime: now,
      status: this.status,
    });

    return {
      mode: this.mode,
      status: this.status,
      durationSeconds: this.durationSeconds,
      remainingSeconds: calc.remainingSeconds,
      remainingMs: calc.remainingMs,
      progress: calc.progress,
      isCompleted: calc.isCompleted,
      completedSessions: this.completedSessions,
      activeTaskId: this.activeTaskId,
      isMuted: this.isMuted,
      formattedTime: formatTimeRemaining(calc.remainingSeconds),
    };
  };

  private startTicker() {
    if (this.intervalId || typeof window === 'undefined') return;
    this.intervalId = setInterval(() => {
      if (this.status !== 'running') {
        this.stopTicker();
        return;
      }
      const snapshot = this.getSnapshot();
      if (snapshot.isCompleted) {
        this.completeSession();
      } else {
        this.notify();
      }
    }, 200);
  }

  private stopTicker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public start = (now = Date.now()): FocusTimerSnapshot => {
    if (this.status === 'running') return this.getState(now);

    if (this.status === 'completed' || this.status === 'idle') {
      this.accumulatedMs = 0;
    }
    this.startedAt = now;
    this.status = 'running';
    this.startTicker();
    this.notify();
    return this.getState(now);
  };

  public pause = (now = Date.now()): FocusTimerSnapshot => {
    if (this.status !== 'running') return this.getState(now);

    if (this.startedAt) {
      this.accumulatedMs += Math.max(0, now - this.startedAt);
      this.startedAt = null;
    }
    this.status = 'paused';
    this.stopTicker();
    this.notify();
    return this.getState(now);
  };

  public resume = (now = Date.now()): FocusTimerSnapshot => {
    return this.start(now);
  };

  public reset = (now = Date.now()): FocusTimerSnapshot => {
    this.status = 'idle';
    this.accumulatedMs = 0;
    this.startedAt = null;
    this.durationSeconds = this.getDurationForMode(this.mode);
    this.stopTicker();
    this.notify();
    return this.getState(now);
  };

  public switchMode = (newMode: FocusMode, now = Date.now()): FocusTimerSnapshot => {
    if (this.mode === newMode && this.status === 'idle') return this.getState(now);
    this.mode = newMode;
    this.status = 'idle';
    this.accumulatedMs = 0;
    this.startedAt = null;
    this.durationSeconds = this.getDurationForMode(newMode);
    this.stopTicker();
    this.notify();
    return this.getState(now);
  };

  public bindTask = (taskId: string | null) => {
    this.activeTaskId = taskId || null;
    this.notify();
    return this.getState();
  };

  public unbindTask = () => {
    this.activeTaskId = null;
    this.notify();
    return this.getState();
  };

  public setMuted = (muted: boolean) => {
    this.isMuted = Boolean(muted);
    this.notify();
    return this.getState();
  };

  public toggleMute = () => {
    this.isMuted = !this.isMuted;
    this.notify();
    return this.getState();
  };

  public getNextRecommendedMode = (): FocusMode => {
    if (this.mode === 'focus') {
      if (this.completedSessions > 0 && this.completedSessions % this.config.sessionsBeforeLongBreak === 0) {
        return 'longBreak';
      }
      return 'shortBreak';
    }
    return 'focus';
  };

  public skip = (now = Date.now()): FocusTimerSnapshot => {
    const nextMode = this.getNextRecommendedMode();
    this.switchMode(nextMode, now);
    return this.getState(now);
  };

  public tick = (now = Date.now()): FocusTimerSnapshot => {
    if (this.status !== 'running') return this.getState(now);

    const state = this.getState(now);
    if (state.isCompleted) {
      this.status = 'completed';
      this.startedAt = null;
      this.accumulatedMs = this.durationSeconds * 1000;
      this.stopTicker();

      const completedRecord = {
        mode: this.mode,
        completedAt: now,
        taskId: this.activeTaskId,
        sessionNumber: this.completedSessions + (this.mode === 'focus' ? 1 : 0),
      };
      this.completionHistory.push(completedRecord);

      if (this.mode === 'focus') {
        this.completedSessions += 1;
      }

      this.notify('sessionCompleted', completedRecord);
      return this.getState(now);
    }

    return state;
  };

  public completeSession = (now = Date.now()) => {
    this.tick(now);
  };

  public subscribe = (listener: (snapshot: FocusTimerSnapshot, event?: string, payload?: any) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(event?: string, payload?: any) {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot, event, payload);
      } catch {
        // Safe listener failure isolation
      }
    });
  }
}

export const PomodoroStateMachine = FocusTimerStore;

export const focusTimerStore = new FocusTimerStore();
