import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@Utils/cn';
import { useProUpsellBanner } from '@AH/useProUpsellBanner';
import { useRTL } from '@Hooks/useRTL';

/**
 * SideNav component renders a sliding side navigation panel.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to display inside the side navigation panel.
 * @param {boolean} props.isOpen - Determines whether the side navigation is visible.
 * @param {'left' | 'right'} [props.position='right'] - Position of the side navigation on the screen.
 * @param {string} [props.className] - Optional additional class names for custom styling.
 * @param {boolean} [props.showLoading=false] - Whether to show a loading indicator in the panel.
 *
 * @returns {JSX.Element} The rendered SideNav component.
 */
export function SideNav({
  children,
  isOpen,
  position = 'right',
  className,
  showLoading = false,
}) {
  const [contentReady, setContentReady] = useState(isOpen);
  const [showChildren, setShowChildren] = useState(isOpen);
  const [adminMenuWidth, setAdminMenuWidth] = useState(160);
  const { shouldShowBanner } = useProUpsellBanner();
  const isRTL = useRTL();

  const isRight = position === 'right';

  // RTL-aware slide direction - flip the slide direction in RTL
  const getSlideX = (value) => isRTL ? (value === '100%' ? '-100%' : '100%') : value;

  useEffect(() => {
    if (isOpen) {
      setShowChildren(false);

      requestAnimationFrame(() => {
        setContentReady(true);
        const delay = showLoading ? 200 : 0;
        setTimeout(() => {
          setShowChildren(true);
        }, delay);
      });
    } else {
      setContentReady(false);
      setShowChildren(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const el = document.getElementById('adminmenuback');
    if (!el) return;

    // Initial set
    setAdminMenuWidth(el.offsetWidth);

    const resizeObserver = new ResizeObserver(() => {
      setAdminMenuWidth(el.offsetWidth);
    });

    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

  const panel = (
    <motion.div
      key='sidenav'
      className={cn(
        'wpchat:fixed wpchat:top-0 wpchat:bottom-0 wpchat:z-99 wpchat:w-full wpchat:bg-white wpchat:shadow-[-8px_0_20px_rgba(0,0,0,0.1)] wpchat:outline-none wpchat:md:w-[500px]',
        shouldShowBanner ? 'wpchat:mt-[130px]' : 'wpchat:mt-[98px]',
        className,
      )}
      style={!isRight ? { insetInlineStart: adminMenuWidth } : { insetInlineEnd: 0 }}
      initial={{ x: isRight ? getSlideX('100%') : getSlideX('-100%') }}
      animate={{ x: 0 }}
      exit={{ x: isRight ? getSlideX('100%') : getSlideX('-100%') }}
      transition={{
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <div className='wpchat:h-full wpchat:w-full wpchat:overflow-hidden wpchat:overflow-y-auto'>
        {showChildren ? (
          children
        ) : (
          <div className='wpchat:flex wpchat:h-full wpchat:items-center wpchat:justify-center'>
            <div className='wpchat:border-t-wp-blue-500 wpchat:h-8 wpchat:w-8 wpchat:animate-spin wpchat:rounded-full wpchat:border-4 wpchat:border-gray-300' />
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && contentReady && panel}
    </AnimatePresence>
  );
}
