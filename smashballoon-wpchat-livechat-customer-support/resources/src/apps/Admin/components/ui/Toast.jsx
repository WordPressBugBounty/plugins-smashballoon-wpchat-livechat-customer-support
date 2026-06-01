// Toast.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransitions } from '@Hooks/useTransitions';
import SvgLoader from '@Components/SvgLoader';

export const Toast = ({ message, show, onClose, type = 'success' }) => {
  const transition = useTransitions({ type: 'slideUpFade', onTrigger: show });

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'wpchat:bg-green-50',
          border: 'wpchat:border-green-200',
          text: 'wpchat:text-green-800',
          icon: 'checkCircleSolid',
          iconColor: 'wpchat:fill-green-600'
        };
      case 'error':
        return {
          bg: 'wpchat:bg-red-50',
          border: 'wpchat:border-red-200',
          text: 'wpchat:text-red-800',
          icon: 'warningSolid',
          iconColor: 'wpchat:fill-red-600'
        };
      default:
        return {
          bg: 'wpchat:bg-gray-50',
          border: 'wpchat:border-gray-200',
          text: 'wpchat:text-gray-800',
          icon: 'info',
          iconColor: 'wpchat:fill-gray-600'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="wpchat:fixed wpchat:bottom-6 wpchat:end-6 wpchat:z-50 wpchat:max-w-md">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={transition.transition}
            className={`wpchat:flex wpchat:items-center wpchat:px-4 wpchat:py-3 wpchat:rounded-lg wpchat:shadow-lg wpchat:border ${styles.bg} ${styles.border}`}
          >
            <SvgLoader
              name={styles.icon}
              className={`wpchat:h-5 wpchat:w-5 wpchat:flex-shrink-0 wpchat:me-2 ${styles.iconColor}`}
            />
            <span className={`wpchat:flex-1 wpchat:text-sm wpchat:font-medium ${styles.text}`}>
              {message}
            </span>
            <button
              onClick={onClose}
              className={`wpchat:flex-shrink-0 wpchat:cursor-pointer wpchat:p-1 wpchat:rounded wpchat:transition-colors hover:wpchat:bg-black/5 ${styles.text}`}
            >
              <SvgLoader
                name='close'
                className={`wpchat:h-4 wpchat:w-4 ${styles.iconColor}`}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
