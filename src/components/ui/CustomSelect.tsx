import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { feedback } from '../../utils/feedback';
import { APPLE_SPRINGS } from '../../utils/motion';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: (SelectOption | string)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface Coords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  placement: 'down' | 'up';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

  // Normalize options
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Position calculation: floats freely in air above parent containers
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const popoverEstimatedHeight = Math.min(240, normalizedOptions.length * 36 + 16);
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const popoverWidth = Math.max(rect.width, 160);
    // Clamp left coordinate so it never bleeds beyond screen edges
    const left = Math.max(8, Math.min(rect.left, viewportWidth - popoverWidth - 8));

    if (spaceBelow < popoverEstimatedHeight && spaceAbove > spaceBelow) {
      // Flip upwards above the trigger element
      setCoords({
        bottom: viewportHeight - rect.top + 6,
        left,
        width: popoverWidth,
        placement: 'up',
      });
    } else {
      // Open downwards below the trigger element
      setCoords({
        top: rect.bottom + 6,
        left,
        width: popoverWidth,
        placement: 'down',
      });
    }
  }, [normalizedOptions.length]);

  // Recalculate on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Click outside listener (handles trigger in parent and popover in body)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    feedback.playClick();
    onChange(val);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    feedback.playClick();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full h-9 px-3 rounded-xl solid-input custom-select-trigger flex items-center justify-between text-xs font-medium text-[var(--text-primary)] pressable gap-1.5 transition-colors cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Popover Options: Portaled to document.body (Zero container clipping) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && coords && (
              <motion.div
                ref={popoverRef}
                role="listbox"
                aria-labelledby={selectId}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: coords.placement === 'up' ? 6 : -6,
                }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: coords.placement === 'up' ? 4 : -4,
                }}
                transition={APPLE_SPRINGS.snappy}
                className="fixed z-[99999] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto no-scrollbar border border-white/12 backdrop-blur-2xl bg-zinc-900/95"
                style={{
                  top: coords.top !== undefined ? `${coords.top}px` : undefined,
                  bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
                  left: `${coords.left}px`,
                  width: `${coords.width}px`,
                  willChange: 'transform, opacity',
                }}
              >
                {normalizedOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between text-left pressable transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-white font-bold shadow-sm'
                          : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
