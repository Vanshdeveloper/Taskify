import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  direction = 'up',
  delay = 0,
  className = '',
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(direction === 'down' ? value : 0);
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 180,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      motionVal.set(value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [motionVal, value, delay]);

  useEffect(() => {
    const unsubscribe = springVal.on('change', (latest) => {
      if (ref.current) {
        const formatted = Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(latest.toFixed(decimalPlaces)));
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [springVal, decimalPlaces, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={`inline-block tabular-nums tracking-tight select-none ${className}`}
    >
      {prefix}
      {Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value)}
      {suffix}
    </span>
  );
};
