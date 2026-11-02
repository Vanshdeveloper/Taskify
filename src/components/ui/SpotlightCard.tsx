import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  enableTilt?: boolean;
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  contentClassName,
  enableTilt = false,
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinates relative to card
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  // Tilt physics
  const rotateX = useSpring(0, { damping: 25, stiffness: 240 });
  const rotateY = useSpring(0, { damping: 25, stiffness: 240 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = -((y - centerY) / centerY) * 3; // subtle 3 degrees max
      const tiltY = ((x - centerX) / centerX) * 3;
      rotateX.set(tiltX);
      rotateY.set(tiltY);
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    cardRef.current?.style.setProperty('--spotlight-opacity', '1');
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    cardRef.current?.style.setProperty('--spotlight-opacity', '0');
    if (enableTilt) {
      rotateX.set(0);
      rotateY.set(0);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`spotlight-border spotlight-glow glass-card-pro transition-shadow relative overflow-hidden ${className}`}
      {...(props as any)}
    >
      {/* Dynamic Border Light Reflection */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at var(--mouse-x, -200px) var(--mouse-y, -200px), ${spotlightColor}, transparent 70%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      {/* Surface content */}
      {contentClassName ? (
        <div className={`relative z-10 w-full h-full ${contentClassName}`}>
          {children}
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
};
