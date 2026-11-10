import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Synthetic Web Audio haptic click & chime
class AudioFeedbackEngine {
  private ctx: AudioContext | null = null;
  private isHapticsEnabled: boolean = true;

  setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
  }

  getHapticsEnabled(): boolean {
    return this.isHapticsEnabled;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Apple-like crisp mechanical click on button press + native mobile haptic
  playClick() {
    // 1. Native mobile hardware haptic impact (gated by user setting)
    if (this.isHapticsEnabled) {
      try {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {
        // Graceful fallback on web
      }
    }

    // 2. Synthetic Web Audio click
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy catch
    }
  }

  // Delicate joyful bell chime on task/habit completion + native success vibration
  playSuccessChime() {
    // 1. Native mobile hardware success notification (gated by user setting)
    if (this.isHapticsEnabled) {
      try {
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      } catch {
        // Graceful fallback on web
      }
    }

    // 2. Synthetic Web Audio chime
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + idx * 0.04 + 0.4);
      });
    } catch {
      // Audio autoplay policy catch
    }
  }

  // Soothing multi-frequency Solfeggio bell chime chord for Pomodoro/Focus milestones
  playFocusChime(type: 'focusComplete' | 'breakComplete' | 'focus' | 'break' = 'focusComplete') {
    if (this.isHapticsEnabled) {
      try {
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      } catch {
        // Graceful fallback on web
      }
    }

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const isBreak = type === 'breakComplete' || type === 'break';
      // Solfeggio 528Hz bell chord vs bright break chord
      const freqs = isBreak
        ? [587.33, 739.99, 880.0, 1174.66] // D5, F#5, A5, D6 bright rising chord
        : [528.0, 660.0, 792.0, 1056.0]; // 528Hz Solfeggio triad + harmonic shimmer

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const startTime = now + idx * 0.05;
        const peakTime = startTime + 0.04;
        const duration = 1.2 + idx * 0.2;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.09 / (idx + 1), peakTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      });
    } catch {
      // Audio autoplay policy catch
    }
  }
}

export const feedback = new AudioFeedbackEngine();

export function triggerCompletionConfetti(originX = 0.5, originY = 0.5) {
  // 1. Immediate zero-latency auditory & native haptic feedback
  feedback.playSuccessChime();

  // 2. Asynchronously load canvas-confetti on-demand to keep critical initial bundle lean
  import('canvas-confetti')
    .then((module) => {
      const confetti = module.default ?? module;
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: ['#6366f1', '#38bdf8', '#34d399', '#f43f5e', '#fbbf24'],
        disableForReducedMotion: true,
        scalar: 0.8,
      });
    })
    .catch(() => {
      // Graceful fallback if dynamic import or animation fails
    });
}
