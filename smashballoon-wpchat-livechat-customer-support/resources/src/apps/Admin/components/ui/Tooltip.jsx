import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Tooltip as AriaTooltip, OverlayArrow } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { useRTL, rtlX } from '@Hooks/useRTL';

const styles = tv({
  base: 'wpchat:group wpchat:rounded-lg wpchat:border wpchat:border-slate-800 wpchat:bg-slate-700 wpchat:px-3 wpchat:py-1 wpchat:text-sm wpchat:text-white wpchat:shadow-[inset_0_1px_0_0_var(--color-gray-600)] wpchat:drop-shadow-lg wpchat:will-change-transform wpchat:max-w-xs wpchat:break-words',
});

const getMotionVariants = (isRTL) => ({
  initial: (custom) => ({
    opacity: 0,
    y: custom?.includes('bottom') ? 4 : custom?.includes('top') ? -4 : 0,
    x: custom?.includes('left') ? rtlX(-4, isRTL) : custom?.includes('right') ? rtlX(4, isRTL) : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: (custom) => ({
    opacity: 0,
    y: custom?.includes('bottom') ? 4 : custom?.includes('top') ? -4 : 0,
    x: custom?.includes('left') ? rtlX(-4, isRTL) : custom?.includes('right') ? rtlX(4, isRTL) : 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  }),
});

export function Tooltip({ children, ...props }) {
  const [placement, setPlacement] = useState(null);
  const isRTL = useRTL();
  const motionVariants = getMotionVariants(isRTL);

  return (
    <AriaTooltip
      {...props}
      offset={10}
      onPlacementChange={(newPlacement) => setPlacement(newPlacement)}
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
            className={styles()}
          >
            <OverlayArrow>
              <svg
                width={8}
                height={8}
                viewBox='0 0 8 8'
                className={`wpchat:fill-slate-700 wpchat:stroke-gray-800 ${
                  placement === 'bottom'
                    ? 'wpchat:rotate-180'
                    : placement === 'left'
                      ? 'wpchat:-rotate-90'
                      : placement === 'right'
                        ? 'wpchat:rotate-90'
                        : ''
                }`}
              >
                <path d='M0 0 L4 4 L8 0' />
              </svg>
            </OverlayArrow>
            {children}
          </motion.div>
        );
      }}
    </AriaTooltip>
  );
}
