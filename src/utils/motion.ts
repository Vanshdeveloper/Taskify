// Unified fluid motion tokens for consistent 60-120fps physics

/**
 * Standard Fluid Design System Spring Tokens
 * - modal: Critically damped (zeta = 1.0, duration = 0.35s) for zero overshoot dialog presentation.
 * - sheet: Critically damped (zeta = 1.0, duration = 0.35s) for slide-over side drawers and bottom sheets.
 * - snappy: Snappy response (duration = 0.30s, damping = 28, stiffness = 380) for slider rebounds and flicks.
 */
export const APPLE_SPRINGS = {
  modal: {
    type: 'spring' as const,
    damping: 38,
    stiffness: 360,
    bounce: 0,
    duration: 0.35,
  },
  sheet: {
    type: 'spring' as const,
    damping: 36,
    stiffness: 340,
    bounce: 0,
    duration: 0.35,
  },
  snappy: {
    type: 'spring' as const,
    damping: 28,
    stiffness: 380,
    bounce: 0,
    duration: 0.30,
  },
} as const;

export const SPRING_LIQUID = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 300,
  mass: 0.8,
};

export const SPRING_TACTILE = {
  type: 'spring' as const,
  damping: 22,
  stiffness: 400,
};

export const SPRING_PILL = {
  type: 'spring' as const,
  damping: 26,
  stiffness: 420,
};

// Aliases for backwards compatibility across existing components
export const SPRING_MODAL = APPLE_SPRINGS.modal;
export const SPRING_SHEET = APPLE_SPRINGS.sheet;
export const SPRING_SNAPPY = APPLE_SPRINGS.snappy;

// Viscous fluid damping (newly greased / oiled glass glide)
export const SPRING_VISCOUS_FLUID = {
  type: 'spring' as const,
  damping: 32,
  stiffness: 220,
  mass: 0.85,
};

// Fast reactive spring for dynamic floating dock pill
export const SPRING_DOCK_LIQUID = {
  type: 'spring' as const,
  damping: 26,
  stiffness: 340,
  mass: 0.7,
};

/**
 * Fluid exponential momentum projection.
 * Projects resting endpoint from gesture release velocity without snapping abruptly.
 * @param velocity Initial gesture velocity in px/s
 * @param decelerationRate Rate of decay (0.992 for viscous oil feel, 0.998 for normal scroll)
 */
export function projectMomentum(velocity: number, decelerationRate = 0.992): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}
