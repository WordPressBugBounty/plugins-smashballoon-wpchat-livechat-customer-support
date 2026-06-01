import React, { useEffect, useState } from 'react';
import {
  Popover as AriaPopover,
  OverlayArrow,
  PopoverContext,
  useSlottedContext,
} from 'react-aria-components';
import { motion } from 'motion/react';
import { tv } from 'tailwind-variants';
import { useRTL, rtlX } from '@Hooks/useRTL';

const styles = tv({
  base: 'forced-colors:wpchat:bg-[Canvas] wpchat:border-gray-200 wpchat:w-[var(--trigger-width)] wpchat:rounded-sm wpchat:border wpchat:bg-white wpchat:bg-clip-padding wpchat:text-slate-700 wpchat:shadow-2xl',
});

const getMotionVariants = (isRTL) => ({
  initial: (custom) => ({
    opacity: 0,
    y: custom?.includes('bottom') ? -10 : custom?.includes('top') ? 10 : 0,
    x: custom?.includes('left') ? rtlX(10, isRTL) : custom?.includes('right') ? rtlX(-10, isRTL) : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: (custom) => ({
    opacity: 0,
    y: custom?.includes('bottom') ? -10 : custom?.includes('top') ? 10 : 0,
    x: custom?.includes('left') ? rtlX(10, isRTL) : custom?.includes('right') ? rtlX(-10, isRTL) : 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  }),
});

export function Popover({ children, showArrow, className, ...props }) {
  const popoverContext = useSlottedContext(PopoverContext);
  const isSubmenu = popoverContext?.trigger === 'SubmenuTrigger';
  const offset = isSubmenu ? (showArrow ? 6 : 2) : showArrow ? 12 : 8;
  const isRTL = useRTL();
  const motionVariants = getMotionVariants(isRTL);

  const [placement, setPlacement] = useState(null);

  return (
    <AriaPopover
      offset={offset}
      {...props}
      onPlacementChange={(newPlacement) => setPlacement(newPlacement)}
      className={styles({ className })}
    >
      {({ placement: newPlacement }) => {
        useEffect(() => {
          if (newPlacement) setPlacement(newPlacement);
        }, [newPlacement]);

        if (!placement) return null;

        return (
          <motion.div
            initial='initial'
            animate='animate'
            exit='exit'
            variants={motionVariants}
            custom={placement}
            className='wpchat:relative'
          >
            {showArrow && (
              <OverlayArrow className='wpchat:group'>
                <svg
                  width={12}
                  height={12}
                  viewBox='0 0 12 12'
                  className='forced-colors:wpchat:fill-[Canvas] forced-colors:wpchat:stroke-[ButtonBorder] group-placement-bottom:wpchat:rotate-180 group-placement-left:wpchat:-rotate-90 group-placement-right:wpchat:rotate-90 wpchat:block wpchat:fill-white wpchat:stroke-black/10 wpchat:stroke-1'
                >
                  <path d='M0 0 L6 6 L12 0' />
                </svg>
              </OverlayArrow>
            )}
            {children}
          </motion.div>
        );
      }}
    </AriaPopover>
  );
}
