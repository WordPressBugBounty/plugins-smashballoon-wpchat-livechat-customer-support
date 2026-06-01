import React from 'react';
import { tv } from 'tailwind-variants';
import { cn } from '@Utils/cn';

const badge = tv({
  base: 'wpchat:px-2.5 wpchat:py-0.5 wpchat:rounded-full wpchat:text-xs wpchat:font-semibold inline-block',
  variants: {
    variant: {
      default: 'wpchat:bg-wp-blue-50 wpchat:text-wp-blue-500',
      success: 'wpchat:bg-green-100 wpchat:text-green-700',
      danger: 'wpchat:bg-red-50 wpchat:text-red-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
/**
 * Badge Component
 *
 * Renders a stylized label badge for status indication (e.g., success, danger, info).
 *
 * @param {Object} props - Component props.
 * @param {string} props.children - The badge text.
 * @param {'normal' | 'success' | 'danger'} [props.variant='normal'] - The badge style.
 * @param {string} [props.className] - Additional class names.
 * @returns {JSX.Element}
 */
export function Badge({ children, variant = 'default', className }) {
  return <span className={cn(badge({ variant }), className)}>{children}</span>;
}