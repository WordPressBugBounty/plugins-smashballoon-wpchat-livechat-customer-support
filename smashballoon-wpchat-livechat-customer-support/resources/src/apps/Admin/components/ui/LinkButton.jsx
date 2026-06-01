import React from 'react';
import { tv } from 'tailwind-variants';
import { focusRing } from './utils';
import { cn } from '@Utils/cn';

const linkButton = tv({
  extend: focusRing,
  base: 'wpchat:[&_svg]:fill-white wpchat:flex wpchat:cursor-pointer wpchat:items-center wpchat:justify-center wpchat:gap-1 wpchat:rounded-md wpchat:px-3 wpchat:py-2 wpchat:text-center wpchat:text-sm wpchat:font-semibold wpchat:antialiased wpchat:shadow wpchat:inset-shadow-2xs wpchat:outline-0 wpchat:outline-offset-0 wpchat:outline-sky-300/40 wpchat:transition-all wpchat:outline-solid wpchat:hover:scale-102 wpchat:focus-visible:outline-4 wpchat:active:scale-98 wpchat:active:shadow-none wpchat:backface-hidden wpchat:will-change-transform wpchat:no-underline wpchat:inline-flex',
  variants: {
    variant: {
      primary: 'wpchat:[&_svg]:fill-white wpchat:text-shadow-2xs wpchat:border wpchat:border-wp-blue-500 wpchat:bg-wp-blue-500 wpchat:text-white wpchat:shadow-wp-blue-800/30 wpchat:inset-shadow-white/20 wpchat:hover:bg-wp-blue-600 wpchat:hover:shadow-wp-blue-800/20 wpchat:hover:border-wp-blue-600 wpchat:hover:text-white wpchat:active:shadow-wp-blue-800/30 wpchat:active:inset-shadow-black/30 wpchat:active:inset-shadow-xs',
      secondary:
        'wpchat:[&_svg]:fill-gray-900 wpchat:text-gray-900 wpchat:border wpchat:border-black/10 wpchat:bg-gray-50 wpchat:shadow-black/10 wpchat:inset-shadow-white wpchat:hover:bg-gray-100 wpchat:hover:text-gray-900 wpchat:active:inset-shadow-2xs wpchat:active:inset-shadow-black/5',
      tertiary: 'wpchat:border-green-700 wpchat:hover:border-green-700 wpchat:text-shadow-2xs wpchat:bg-green-700 wpchat:text-white wpchat:shadow-sm wpchat:shadow-emerald-900/25 wpchat:inset-shadow-white/30 wpchat:hover:text-white wpchat:active:inset-shadow-black/30 wpchat:active:inset-shadow-xs',
      quaternary: 'wpchat:text-wp-blue-500 wpchat:[&_svg]:fill-wp-blue-500 wpchat:bg-wp-light-blue-50 wpchat:border-wp-blue-100 wpchat:border wpchat:shadow-none wpchat:hover:text-wp-blue-500',
      danger:
        'wpchat:[&_svg]:fill-red-700 wpchat:text-red-700 wpchat:border wpchat:border-black/10 wpchat:bg-gray-50 wpchat:shadow-black/10 wpchat:inset-shadow-white wpchat:hover:bg-gray-100 wpchat:hover:text-red-700 wpchat:active:inset-shadow-2xs wpchat:active:inset-shadow-black/5',
      error: 'wpchat:border wpchat:border-red-700 wpchat:bg-red-700 wpchat:text-white wpchat:text-shadow-2xs wpchat:shadow-red-800/30 wpchat:inset-shadow-white/20 wpchat:hover:bg-red-800 wpchat:hover:border-red-800 wpchat:hover:shadow-red-800/20 wpchat:hover:text-white wpchat:active:shadow-red-800/30 wpchat:active:inset-shadow-black/30 wpchat:active:inset-shadow-xs',
      noStyle: 'wpchat:border-0 wpchat:shadow-none wpchat:p-0',
    },
    isDisabled: {
      true: 'wpchat:cursor-not-allowed wpchat:opacity-50 wpchat:pointer-events-none',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

/**
 * LinkButton component that looks like a Button but acts as a link.
 * Uses the same styling as the Button component but renders as an anchor tag.
 *
 * @param {Object} props - LinkButton component props.
 * @param {string} props.href - The URL to navigate to.
 * @param {string} [props.variant='primary'] - Visual style of the button (e.g., 'primary', 'secondary', 'danger').
 * @param {string} [props.className] - Additional CSS classes for custom styling.
 * @param {boolean} [props.isDisabled] - Whether the link button is disabled.
 * @param {string} [props.target] - Target attribute for the link (e.g., '_blank').
 * @param {string} [props.rel] - Rel attribute for the link (e.g., 'noopener noreferrer').
 * @param {React.ReactNode} props.children - The content of the link button.
 * @param {...Object} props - Additional props are passed directly to the underlying anchor element.
 *
 * @returns {JSX.Element} The rendered LinkButton component.
 */
export function LinkButton({ 
  href, 
  variant = 'primary', 
  className, 
  isDisabled = false,
  target,
  rel,
  children, 
  ...props 
}) {
  return (
    <a
      href={isDisabled ? undefined : href}
      target={target}
      rel={rel}
      className={cn(
        linkButton({ variant, isDisabled }),
        className
      )}
      aria-disabled={isDisabled}
      {...props}
    >
      {children}
    </a>
  );
}