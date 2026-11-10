import { useSyncExternalStore, useEffect, useRef } from 'react';
import { focusTimerStore, type FocusTimerSnapshot } from '../utils/focusTimer';
import { feedback, triggerCompletionConfetti } from '../utils/feedback';

/**
 * Feature F14: React Hook for Focus / Pomodoro Timer
 * Provides 1:1 synchronization across TodayView, TasksView, and FocusTimerModal
 * without causing unnecessary re-renders of the AppContext tree.
 */
export function useFocusTimer() {
  const snapshot: FocusTimerSnapshot = useSyncExternalStore(
    focusTimerStore.subscribe,
    focusTimerStore.getSnapshot,
    focusTimerStore.getSnapshot
  );

  const prevStatusRef = useRef(snapshot.status);

  useEffect(() => {
    if (prevStatusRef.current !== 'completed' && snapshot.status === 'completed') {
      // 1. Play soothing Solfeggio bell chime if not muted
      if (!snapshot.isMuted) {
        feedback.playFocusChime(snapshot.mode === 'focus' ? 'focusComplete' : 'breakComplete');
      }
      // 2. Confetti burst on focus completion
      if (snapshot.mode === 'focus') {
        triggerCompletionConfetti();
      }
    }
    prevStatusRef.current = snapshot.status;
  }, [snapshot.status, snapshot.mode, snapshot.isMuted]);

  return {
    ...snapshot,
    start: focusTimerStore.start,
    pause: focusTimerStore.pause,
    resume: focusTimerStore.resume,
    reset: focusTimerStore.reset,
    skip: focusTimerStore.skip,
    switchMode: focusTimerStore.switchMode,
    bindTask: focusTimerStore.bindTask,
    unbindTask: focusTimerStore.unbindTask,
    toggleMute: focusTimerStore.toggleMute,
    setMuted: focusTimerStore.setMuted,
    nextRecommendedMode: focusTimerStore.getNextRecommendedMode(),
  };
}
