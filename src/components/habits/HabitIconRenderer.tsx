import React from 'react';
import {
  Target,
  Flame,
  Dumbbell,
  BookOpen,
  Droplet,
  Heart,
  Brain,
  Coffee,
  Zap,
  Shield,
  Smile,
  Moon,
  Sun,
  Music,
  Code,
  Repeat,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export interface HabitIconOption {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

export const HABIT_ICON_OPTIONS: HabitIconOption[] = [
  { id: 'target', label: 'Target', icon: Target },
  { id: 'flame', label: 'Streak', icon: Flame },
  { id: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { id: 'book', label: 'Reading', icon: BookOpen },
  { id: 'droplet', label: 'Hydration', icon: Droplet },
  { id: 'heart', label: 'Wellness', icon: Heart },
  { id: 'brain', label: 'Mindset', icon: Brain },
  { id: 'coffee', label: 'Morning', icon: Coffee },
  { id: 'zap', label: 'Energy', icon: Zap },
  { id: 'shield', label: 'Discipline', icon: Shield },
  { id: 'smile', label: 'Mood', icon: Smile },
  { id: 'sun', label: 'Daily', icon: Sun },
  { id: 'moon', label: 'Evening', icon: Moon },
  { id: 'music', label: 'Creative', icon: Music },
  { id: 'code', label: 'Deep Work', icon: Code },
  { id: 'repeat', label: 'Routine', icon: Repeat },
];

export const HABIT_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  target: Target,
  flame: Flame,
  dumbbell: Dumbbell,
  book: BookOpen,
  'book-open': BookOpen,
  droplet: Droplet,
  droplets: Droplet,
  heart: Heart,
  brain: Brain,
  coffee: Coffee,
  zap: Zap,
  shield: Shield,
  smile: Smile,
  sun: Sun,
  moon: Moon,
  music: Music,
  code: Code,
  repeat: Repeat,
  compass: Compass,
  check: CheckCircle2,
};

interface HabitIconRendererProps {
  icon?: string;
  className?: string;
}

export const HabitIconRenderer: React.FC<HabitIconRendererProps> = ({
  icon,
  className = 'w-5 h-5',
}) => {
  const normalizedKey = (icon || '').toLowerCase().trim();
  const IconComponent = HABIT_ICON_MAP[normalizedKey] || Repeat;
  return <IconComponent className={className} />;
};
