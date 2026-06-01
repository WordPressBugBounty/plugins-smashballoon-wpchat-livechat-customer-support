import { useRTL, rtlX } from './useRTL';

/**
 * Custom hook that returns animation configurations for different transition effects.
 * Automatically adjusts horizontal (x) animations for RTL layouts.
 *
 * @function
 * @param {Object} [options={}] - Configuration options for the transition.
 * @param {boolean} [options.onTrigger=true] - Determines whether the animation should be triggered.
 * @param {string} [options.type="slideUpFade"] - The type of transition effect.
 *    Available types: "slideUpFade", "fadeIn", "scaleUp", "slideLeft".
 *
 * @returns {Object} The selected transition configuration for Framer Motion.
 */
export const useTransitions = ({ onTrigger = true, type = 'slideUpFade' } = {}) => {
  const isRTL = useRTL();

  const transitionConfig = {
    slideUpFade: {
      initial: { y: 20, opacity: 0, display: 'none' },
      animate: onTrigger
        ? { y: 0, opacity: 1, display: 'block' }
        : { y: 20, opacity: 0, display: 'none' },
      exit: { y: -20, opacity: 0, display: 'none' },
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
        type: 'spring',
      },
    },
    slideDownFade: {
      initial: { y: -20, opacity: 0 },
      animate: onTrigger ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 },
      exit: { y: 20, opacity: 0 },
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
        type: 'spring',
      },
    },
    fadeIn: {
      initial: { opacity: 0, display: 'none' },
      animate: onTrigger
        ? { opacity: 1, display: 'block' }
        : { opacity: 0, display: 'none' },
      exit: { opacity: 0, display: 'none' },
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    scaleUp: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    slideLeft: {
      initial: { x: rtlX(100, isRTL), opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: rtlX(-100, isRTL), opacity: 0 },
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
        type: 'spring',
      },
    },
  };

  return transitionConfig[type];
};
