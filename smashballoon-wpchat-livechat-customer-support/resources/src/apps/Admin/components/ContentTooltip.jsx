import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@Utils/cn';
import { useRTL, rtlX } from '@Hooks/useRTL';

const placements = {
  top: 'wpchat:bottom-full wpchat:mb-3 wpchat:left-1/2 wpchat:-translate-x-1/2',
  bottom: 'wpchat:top-full wpchat:mt-3 wpchat:left-1/2 wpchat:-translate-x-1/2',
  left: 'wpchat:end-full wpchat:me-3 wpchat:top-1/2 wpchat:-translate-y-1/2',
  right: 'wpchat:start-full wpchat:ms-3 wpchat:top-1/2 wpchat:-translate-y-1/2',
};

const arrows = {
  top: 'wpchat:top-full wpchat:left-1/2 wpchat:-translate-x-1/2 wpchat:border-t-white wpchat:border-x-transparent wpchat:border-b-0',
  bottom:
    'wpchat:bottom-full wpchat:left-1/2 wpchat:-translate-x-1/2 wpchat:border-b-white wpchat:border-x-transparent wpchat:border-t-0',
  left: 'wpchat:start-full wpchat:top-1/2 wpchat:-translate-y-1/2 wpchat:border-s-white wpchat:border-y-transparent wpchat:border-e-0',
  right:
    'wpchat:end-full wpchat:top-1/2 wpchat:-translate-y-1/2 wpchat:border-e-white wpchat:border-y-transparent wpchat:border-s-0',
};

const getSlideOffsets = (isRTL) => ({
  top: { y: 4, x: 0 },
  bottom: { y: -4, x: 0 },
  left: { x: rtlX(4, isRTL), y: 0 },
  right: { x: rtlX(-4, isRTL), y: 0 },
});

/**
 * Calculate the best placement based on available viewport space
 * @param {DOMRect} triggerRect - Bounding rect of the trigger element
 * @param {number} tooltipHeight - Estimated tooltip height
 * @param {number} tooltipWidth - Estimated tooltip width
 * @param {string} preferredPlacement - The preferred placement if space allows
 * @returns {string} - The computed placement
 */
const calculateAutoPlacement = (triggerRect, tooltipHeight = 200, tooltipWidth = 320, preferredPlacement = 'bottom') => {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const margin = 12; // margin from viewport edge

  const spaceAbove = triggerRect.top;
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceLeft = triggerRect.left;
  const spaceRight = viewportWidth - triggerRect.right;

  // If preferred placement has enough space, use it
  if (preferredPlacement === 'bottom' && spaceBelow >= tooltipHeight + margin) return 'bottom';
  if (preferredPlacement === 'top' && spaceAbove >= tooltipHeight + margin) return 'top';
  if (preferredPlacement === 'left' && spaceLeft >= tooltipWidth + margin) return 'left';
  if (preferredPlacement === 'right' && spaceRight >= tooltipWidth + margin) return 'right';

  // Otherwise, find the best placement
  if (spaceBelow >= tooltipHeight + margin) return 'bottom';
  if (spaceAbove >= tooltipHeight + margin) return 'top';
  if (spaceRight >= tooltipWidth + margin) return 'right';
  if (spaceLeft >= tooltipWidth + margin) return 'left';

  // Default to bottom if no space is ideal
  return spaceBelow >= spaceAbove ? 'bottom' : 'top';
};

/**
 * ContentTooltip
 * Shows a tooltip on hover with smooth motion animation.
 * Can be controlled via state or hover (default).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element triggering the tooltip.
 * @param {React.ReactNode} props.content - Tooltip content.
 * @param {'top'|'bottom'|'left'|'right'|'auto'} [props.placement='top'] - Tooltip position. Use 'auto' to dynamically choose based on available space.
 * @param {string} [props.className] - Additional classes for tooltip container.
 * @param {boolean} [props.isControlled=false] - If true, tooltip is controlled by `isOpen` prop instead of hover.
 * @param {boolean} [props.isOpen] - Controls visibility when in controlled mode.
 * @param {boolean} [props.showArrow=true] - If false, hides the tooltip arrow.
 * @param {number} [props.autoDismiss] - Auto dismiss timeout in milliseconds. Shows progress bar and auto-closes.
 * @param {Function} [props.onDismiss] - Callback when auto-dismiss completes.
 * @param {string} [props.dismissBarColor] - Custom color class for the auto-dismiss progress bar.
 */
export default function ContentTooltip({
  children,
  content,
  placement = 'top',
  className,
  isControlled = false,
  isOpen,
  showArrow = true,
  autoDismiss,
  onDismiss,
  dismissBarColor = 'wpchat:bg-wp-light-blue-500'
}) {
  const [internalVisible, setInternalVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [computedPlacement, setComputedPlacement] = useState(placement === 'auto' ? 'bottom' : placement);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const isRTL = useRTL();
  const slideOffsets = getSlideOffsets(isRTL);
  const dismissTimeoutRef = useRef(null);

  // Determine the actual placement to use
  const actualPlacement = placement === 'auto' ? computedPlacement : placement;

  // Use controlled state if isControlled prop is true, otherwise use internal state
  // When dismissing, override to false to trigger exit animation
  const isVisible = isDismissing ? false : (isControlled ? isOpen : internalVisible);

  const handleMouse = (show) => {
    // Only handle mouse events if not in controlled mode
    if (isControlled) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (show) setInternalVisible(true);
    else timeoutRef.current = setTimeout(() => setInternalVisible(false), 150);
  };

  // Reset dismissing state when isOpen changes from outside
  useEffect(() => {
    if (isControlled && isOpen) {
      setIsDismissing(false);
    }
  }, [isControlled, isOpen]);

  // Handle auto-dismiss
  useEffect(() => {
    if (autoDismiss && isVisible && !isDismissing) {
      dismissTimeoutRef.current = setTimeout(() => {
        // Trigger the dismissing state which starts the exit animation
        setIsDismissing(true);
      }, autoDismiss);
    }

    return () => {
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, [autoDismiss, isVisible, isDismissing]);

  // Calculate auto placement when tooltip becomes visible and after render
  useLayoutEffect(() => {
    if (placement === 'auto' && isVisible && containerRef.current && tooltipRef.current) {
      const triggerRect = containerRef.current.getBoundingClientRect();
      // Get actual tooltip dimensions
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const newPlacement = calculateAutoPlacement(triggerRect, tooltipHeight, tooltipWidth);
      if (newPlacement !== computedPlacement) {
        setComputedPlacement(newPlacement);
      }
    }
  }, [placement, isVisible, computedPlacement]);

  return (
    <div
      ref={containerRef}
      className='wpchat:relative wpchat:inline-block'
      tabIndex={0}
      onMouseEnter={() => handleMouse(true)}
      onMouseLeave={() => handleMouse(false)}
      onKeyDown={e => {
        if (isControlled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          handleMouse(true);
          e.preventDefault();
        }
        if (e.key === 'Escape') {
          handleMouse(false);
          e.preventDefault();
        }
      }}
      aria-describedby={isVisible ? 'tooltip' : undefined}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            id='tooltip'
            role='tooltip'
            initial={{
              opacity: 0,
              scale: 0.95,
              ...slideOffsets[actualPlacement],
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              ...slideOffsets[actualPlacement]
            }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            onAnimationComplete={(definition) => {
              // If we're in the exit state (opacity is 0) and we were dismissing
              if (definition.opacity === 0 && isDismissing && onDismiss) {
                // Exit animation has completed, now call onDismiss to update parent state
                onDismiss();
              }
            }}
            className={cn('wpchat:absolute wpchat:z-50 wpchat:min-w-[320px] wpchat:rounded-sm wpchat:bg-white wpchat:p-3 wpchat:shadow-[0_0_10px_0_var(--wpchat-shadow-color,#0000001a)] wpchat:will-change-transform', placements[actualPlacement], className)}
          >
              {autoDismiss && (
                <motion.div
                  className={cn('wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:h-[2px] wpchat:z-10', dismissBarColor)}
                  initial={{ width: '0%', opacity: 1 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    width: { duration: autoDismiss / 1000, ease: 'linear' },
                    opacity: { duration: 0.2 }
                  }}
                />
              )}
              {content}
              {showArrow && (
                <div
                  className={cn(
                    'wpchat:absolute wpchat:h-0 wpchat:w-0 wpchat:border-[6px]',
                    arrows[actualPlacement],
                  )}
                />
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
