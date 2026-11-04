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
    return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
  }
  if (c.includes('fitness') || c.includes('health')) {
    return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
  }
  if (c.includes('creative') || c.includes('design')) {
    return { bg: 'rgba(214, 121, 140, 0.15)', text: '#f472b6', border: 'rgba(214, 121, 140, 0.3)' };
  }
  if (c.includes('study') || c.includes('learn')) {
    return { bg: 'rgba(229, 164, 47, 0.15)', text: '#fbbf24', border: 'rgba(229, 164, 47, 0.3)' };
  }
  return { bg: 'rgba(255, 255, 255, 0.05)', text: '#d4d4d8', border: 'rgba(255, 255, 255, 0.08)' };
}
