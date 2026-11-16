/**
 * Consistent category tag theme styling across Tasks, Today, and Modals
 */
export interface CategoryTheme {
  bg: string;
  text: string;
  border: string;
}

export function getCategoryTheme(cat: string): CategoryTheme {
  const c = cat.toLowerCase();
  if (c.includes('work') || c.includes('office')) {
    return {
      bg: 'var(--cat-work-bg, rgba(59, 130, 246, 0.15))',
      text: 'var(--cat-work-text, #60a5fa)',
      border: 'var(--cat-work-border, rgba(59, 130, 246, 0.3))',
    };
  }
  if (c.includes('fitness') || c.includes('health')) {
    return {
      bg: 'var(--cat-fitness-bg, rgba(16, 185, 129, 0.15))',
      text: 'var(--cat-fitness-text, #34d399)',
      border: 'var(--cat-fitness-border, rgba(16, 185, 129, 0.3))',
    };
  }
  if (c.includes('creative') || c.includes('design')) {
    return {
      bg: 'var(--cat-creative-bg, rgba(214, 121, 140, 0.15))',
      text: 'var(--cat-creative-text, #f472b6)',
      border: 'var(--cat-creative-border, rgba(214, 121, 140, 0.3))',
    };
  }
  if (c.includes('study') || c.includes('learn')) {
    return {
      bg: 'var(--cat-study-bg, rgba(229, 164, 47, 0.15))',
      text: 'var(--cat-study-text, #fbbf24)',
      border: 'var(--cat-study-border, rgba(229, 164, 47, 0.3))',
    };
  }
  if (c.includes('finance') || c.includes('money') || c.includes('budget')) {
    return {
      bg: 'var(--cat-finance-bg, rgba(13, 148, 136, 0.15))',
      text: 'var(--cat-finance-text, #2dd4bf)',
      border: 'var(--cat-finance-border, rgba(13, 148, 136, 0.3))',
    };
  }
  if (c.includes('personal') || c.includes('life') || c.includes('home')) {
    return {
      bg: 'var(--cat-personal-bg, rgba(129, 140, 248, 0.15))',
      text: 'var(--cat-personal-text, #818cf8)',
      border: 'var(--cat-personal-border, rgba(129, 140, 248, 0.3))',
    };
  }
  return {
    bg: 'var(--cat-default-bg, rgba(255, 255, 255, 0.05))',
    text: 'var(--cat-default-text, #d4d4d8)',
    border: 'var(--cat-default-border, rgba(255, 255, 255, 0.08))',
  };
}
