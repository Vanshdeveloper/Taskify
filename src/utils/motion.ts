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
