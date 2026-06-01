import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@Utils/cn';

/**
 * DropdownContent component renders a dropdown panel with animation and closes when clicking outside.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dropdown is currently open.
 * @param {() => void} props.onClose - Callback fired when the dropdown should close (click outside).
 * @param {React.ReactNode} props.children - The content to render inside the dropdown.
 * @param {string} [props.className] - Optional additional class names for the dropdown container.
 *
 * @returns {JSX.Element} The animated dropdown component.
 *
 * @example
 * <DropdownContent isOpen={isOpen} onClose={handleClose}>
 *   <div>Dropdown content here</div>
 * </DropdownContent>
 */
const DropdownContent = ({ isOpen, onClose, children, className }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      const dropdown = e.target.closest('[data-dropdown-root]');
      if (!dropdown) onClose();
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-dropdown-root
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'wpchat:absolute wpchat:top-full wpchat:start-0 wpchat:z-99 wpchat:mt-2 wpchat:rounded-sm wpchat:border wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:shadow-md',
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DropdownContent;
