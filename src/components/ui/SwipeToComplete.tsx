import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { feedback } from '../../utils/feedback';
import { APPLE_SPRINGS } from '../../utils/motion';

interface SwipeToCompleteProps {
  onComplete: () => void;
  isCompleted?: boolean;
}

export const SwipeToComplete: React.FC<SwipeToCompleteProps> = ({
  onComplete,
  isCompleted = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasCompleted, setHasCompleted] = useState(isCompleted);

  const x = useMotionValue(0);
  const backgroundOpacity = useTransform(x, [0, 160], [0.15, 0.45]);

  // Synchronize internal drag state whenever task or completion prop changes
  React.useEffect(() => {
    setHasCompleted(isCompleted);
    if (!isCompleted) {
      x.set(0);
    }
  }, [isCompleted, x]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x > 130 && !hasCompleted) {
      setHasCompleted(true);
      feedback.playSuccessChime();
      onComplete();
    } else {
      // Natural Apple spring rebound returning handle with release velocity
      animate(x, 0, {
        ...APPLE_SPRINGS.snappy,
        velocity: info.velocity?.x,
      });
    }
  };

  if (hasCompleted) {
    return (
      <div className="w-full py-2.5 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold shadow-sm">
        <Check className="w-4 h-4 stroke-[3]" />
        <span>Completed</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-no-swipe="true"
      className="relative w-full h-11 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center px-1 select-none"
    >
      {/* Background track fill on drag */}
      <motion.div
        style={{ opacity: backgroundOpacity }}
        className="absolute inset-0 bg-emerald-500 pointer-events-none"
      />

      {/* Guide text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-medium text-white/80 gap-1 pl-6">
        <span>Drag to mark done</span>
        <div className="flex items-center -space-x-1 opacity-70">
          <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
          <ChevronRight className="w-3.5 h-3.5 animate-pulse delay-75" />
          <ChevronRight className="w-3.5 h-3.5 animate-pulse delay-150" />
        </div>
      </div>

      {/* Draggable handle */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 170 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="relative z-10 w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing font-bold select-none"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
      </motion.div>
    </div>
  );
};
