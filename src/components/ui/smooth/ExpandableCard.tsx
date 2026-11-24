import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ExpandableCardProps {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  className?: string;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  children,
  expandedContent,
  className = '',
  isExpanded: controlledExpanded,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (onToggle) onToggle(next);
    if (controlledExpanded === undefined) setInternalExpanded(next);
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className={`relative overflow-hidden ${className}`}
    >
      <div onClick={handleToggle} className="cursor-pointer">
        {children}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {expandedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
