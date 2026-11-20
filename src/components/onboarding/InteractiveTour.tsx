import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Target,
  Clock,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Check,
} from 'lucide-react';
import { APPLE_SPRINGS } from '../../utils/motion';
import { feedback } from '../../utils/feedback';

export interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface TourStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  visualPreview: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'navigation',
    badge: '1 of 5',
    title: 'Gestures',
    description:
      'Swipe left or right anywhere to switch between tabs. You can also tap the tabs at the bottom.',
    tip: 'Press 1 to 5 on your keyboard to switch tabs quickly.',
    icon: Layers,
    accentColor: '#38bdf8',
    visualPreview: 'Swipe to switch tabs',
  },
  {
    id: 'tasks-habits',
    badge: '2 of 5',
    title: 'Tasks and habits',
    description:
      'Track your tasks for the day and check off daily habits to build streaks.',
    tip: 'Press Cmd+K or Ctrl+K to search across your workspace.',
    icon: Target,
    accentColor: '#10b981',
    visualPreview: 'Daily focus list',
  },
  {
    id: 'focus-timer',
    badge: '3 of 5',
    title: 'Focus timer',
    description:
      'Start a timer for deep work sessions. The progress bar displays around the edge of your screen.',
    tip: 'Tap the stopwatch icon in the top bar to open the timer.',
    icon: Clock,
    accentColor: '#f59e0b',
    visualPreview: 'Screen edge timer',
  },
  {
    id: 'notepad',
    badge: '4 of 5',
    title: 'Notes and flashcards',
    description:
      'Take notes with bold text, highlights, and colors. Turn two-sided notes into study cards.',
    tip: 'Long press a note in the list to select and delete multiple notes.',
    icon: FileText,
    accentColor: '#f26a36',
    visualPreview: 'Notes and study decks',
  },
  {
    id: 'sovereignty',
    badge: '5 of 5',
    title: 'Stored on your device',
    description:
      'Everything stays in your local browser storage. No account or internet connection is required.',
    tip: 'You can export or restore a JSON backup anytime from Settings.',
    icon: ShieldCheck,
    accentColor: '#8b5cf6',
    visualPreview: 'Local offline storage',
  },
];

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Keyboard navigation inside tour (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        feedback.playClick();
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < TOUR_STEPS.length - 1) {
          feedback.playClick();
          setCurrentStep((prev) => prev + 1);
        } else {
          feedback.playSuccessChime();
          onComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          feedback.playClick();
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, onClose, onComplete]);

  if (!isOpen || typeof document === 'undefined') return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const StepIcon = step.icon;

  const handleNext = () => {
    if (isLast) {
      feedback.playSuccessChime();
      onComplete();
    } else {
      feedback.playClick();
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      feedback.playClick();
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    feedback.playClick();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 select-none modal-backdrop">
        {/* Darkened Translucent Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
          style={{ willChange: 'opacity' }}
        />

        {/* Modal Card Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={APPLE_SPRINGS.modal}
          className="relative z-10 w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-zinc-950/95 border border-white/15 shadow-2xl flex flex-col justify-between overflow-hidden"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Ambient Corner Glow Accent */}
          <div
            className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-25 transition-colors duration-500"
            style={{ backgroundColor: step.accentColor }}
          />

          {/* Top Bar: Progress Pills & Close */}
          <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
            <span
              className="text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: `${step.accentColor}18`,
                borderColor: `${step.accentColor}35`,
                color: step.accentColor,
              }}
            >
              {step.badge}
            </span>

            <button
              type="button"
              onClick={handleSkip}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all pressable cursor-pointer"
              title="Skip Tour (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Content with AnimatePresence */}
          <div className="relative z-10 min-h-[220px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex flex-col gap-3"
              >
                {/* Feature Icon & Preview Tag */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md shrink-0"
                    style={{
                      backgroundColor: `${step.accentColor}20`,
                      borderColor: `${step.accentColor}40`,
                      color: step.accentColor,
                    }}
                  >
                    <StepIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <span className="text-xs font-mono font-semibold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                    {step.visualPreview}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight mt-1">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  {step.description}
                </p>

                {/* Interactive Apple-Style Pro-Tip Pill */}
                <div className="mt-2 p-3 rounded-2xl bg-white/[0.04] border border-white/8 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                    {step.tip}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Bar: Stepper Dots & Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-6 mt-4 border-t border-white/10 relative z-10">
            {/* Dots Indicator */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => {
                const isActive = idx === currentStep;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      feedback.playClick();
                      setCurrentStep(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'w-6 bg-[var(--accent-primary)] shadow-sm'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    title={`Jump to ${s.title}`}
                  />
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 pressable transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold pressable transition-all cursor-pointer shadow-md"
                style={{
                  backgroundColor: isLast ? '#10b981' : 'var(--accent-primary)',
                  color: '#ffffff',
                }}
              >
                <span>{isLast ? 'Get Started' : 'Continue'}</span>
                {isLast ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
