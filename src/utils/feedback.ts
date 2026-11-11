import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { HapticSoundStyle } from '../types';

// Synthetic Web Audio haptic click & chime
class AudioFeedbackEngine {
  private ctx: AudioContext | null = null;
  private isHapticsEnabled: boolean = true;
  private hapticSound: HapticSoundStyle = 'apple';

  setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
  }

  getHapticsEnabled(): boolean {
    return this.isHapticsEnabled;
  }

  setHapticSound(sound: HapticSoundStyle) {
    this.hapticSound = sound;
  }

  getHapticSound(): HapticSoundStyle {
    return this.hapticSound;
  }

  private triggerVibration(type: 'click' | 'success') {
    if (!this.isHapticsEnabled) return;

    // 1. Native mobile hardware impact via Capacitor
    try {
      if (type === 'click') {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      } else {
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      }
    } catch {}

    // 2. Direct physical vibration motor fallback across Android WebViews & browsers
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(type === 'click' ? 18 : [20, 40, 25]);
      } catch {}
    }
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

  // Apple-grade physical tactile feedback on button press + native vibration
  playClick() {
    this.triggerVibration('click');

    if (this.hapticSound === 'mute') return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (this.hapticSound === 'apple') {
        // Genuine Apple iOS Taptic Engine Click (Double-impulse micro-transient)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2200, now);
        osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.012);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(950, now);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.012);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.014);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.016);
        osc2.stop(now + 0.016);
      } else if (this.hapticSound === 'pop') {
        // Buoyant bubble pop sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.035);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      } else if (this.hapticSound === 'subtle') {
        // Minimalist micro-tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.009);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.011);
      } else {
        // Mechanical switch click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.035);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // Audio autoplay policy catch
    }
  }

  // Delicate joyful bell chime on task/habit completion + native success vibration
  playSuccessChime() {
    this.triggerVibration('success');

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
