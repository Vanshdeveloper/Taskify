// Apple-grade unified fluid motion tokens for consistent 60-120fps physics
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

export const SPRING_MODAL = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 380,
};

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
 * Apple WWDC 'Designing Fluid Interfaces' exponential momentum projection.
 * Projects resting endpoint from gesture release velocity without snapping abruptly.
 * @param velocity Initial gesture velocity in px/s
 * @param decelerationRate Rate of decay (0.992 for viscous oil feel, 0.998 for normal scroll)
 */
export function projectMomentum(velocity: number, decelerationRate = 0.992): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}
