import React from 'react';
import { Button as RACButton, composeRenderProps } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import LoadingIcon from '@AC/LoadingIcon';
import { cn } from '@Utils/cn';
import { focusRing } from './utils';

const button = tv({
  extend: focusRing,
  base: 'wpchat:flex wpchat:cursor-pointer wpchat:items-center wpchat:justify-center wpchat:gap-1 wpchat:rounded-md wpchat:px-3 wpchat:py-2 wpchat:text-center wpchat:text-sm wpchat:font-semibold wpchat:antialiased wpchat:shadow wpchat:inset-shadow-2xs wpchat:outline-0 wpchat:outline-offset-0 wpchat:outline-sky-300/40 wpchat:transition-all wpchat:will-change-transform wpchat:outline-solid wpchat:backface-hidden wpchat:hover:scale-102 wpchat:focus-visible:outline-4 wpchat:active:scale-98 wpchat:active:shadow-none',
  variants: {
    variant: {
      primary:
        'wpchat:border-wp-blue-500 wpchat:bg-wp-blue-500 wpchat:shadow-wp-blue-800/30 wpchat:hover:bg-wp-blue-600 wpchat:hover:shadow-wp-blue-800/20 wpchat:hover:border-wp-blue-600 wpchat:active:shadow-wp-blue-800/30 wpchat:border wpchat:text-white wpchat:inset-shadow-white/20 wpchat:active:inset-shadow-xs wpchat:active:inset-shadow-black/30 wpchat:[&_svg]:!fill-white',
      secondary:
        'wpchat:border wpchat:border-black/10 wpchat:bg-gray-50 wpchat:text-gray-900 wpchat:shadow-black/10 wpchat:inset-shadow-white wpchat:hover:bg-gray-100 wpchat:active:inset-shadow-2xs wpchat:active:inset-shadow-black/5 wpchat:[&_svg]:!fill-gray-900',
      tertiary:
        'wpchat:border-green-700 wpchat:bg-green-700 wpchat:text-white wpchat:shadow-sm wpchat:shadow-emerald-900/25 wpchat:inset-shadow-white/30 wpchat:hover:border-green-700 wpchat:active:inset-shadow-xs wpchat:active:inset-shadow-black/30 wpchat:[&_svg]:!fill-white',
      quaternary:
        'wpchat:text-wp-blue-500 wpchat:[&_svg]:fill-wp-blue-500 wpchat:bg-wp-light-blue-50 wpchat:border-wp-blue-100 wpchat:border wpchat:shadow-none',
      tabActive: 'wpchat:text-wp-blue-500 wpchat:[&_svg]:!fill-wp-blue-500 wpchat:bg-white',
      tabDisabled:
        'wpchat:bg-gray-100 wpchat:text-gray-800 wpchat:shadow-none wpchat:inset-shadow-none wpchat:hover:shadow-none wpchat:[&_svg]:fill-gray-800',
      danger:
        'wpchat:border wpchat:border-black/10 wpchat:bg-gray-50 wpchat:text-red-700 wpchat:shadow-black/10 wpchat:inset-shadow-white wpchat:hover:bg-gray-100 wpchat:active:inset-shadow-2xs wpchat:active:inset-shadow-black/5 wpchat:[&_svg]:!fill-red-700',
      error:
        'wpchat:border wpchat:border-red-700 wpchat:bg-red-700 wpchat:text-white wpchat:shadow-red-800/30 wpchat:inset-shadow-white/20 wpchat:hover:border-red-800 wpchat:hover:bg-red-800 wpchat:hover:shadow-red-800/20 wpchat:active:inset-shadow-xs wpchat:active:shadow-red-800/30 wpchat:active:inset-shadow-black/30 wpchat:[&_svg]:!fill-white',
      noStyle: 'wpchat:border-0 wpchat:p-0 wpchat:shadow-none',
    },
    isDisabled: {
      true: 'wpchat:cursor-not-allowed wpchat:opacity-50',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

/**
 * Reusable button component with support for variants and custom styling.
 *
 * @param {Object} props - Button component props.
 * @param {string} [props.variant='primary'] - Visual style of the button (e.g., 'primary', 'secondary', 'danger').
 * @param {string} [props.className] - Additional CSS classes for custom styling.
 * @param {...Object} props - Additional props are passed directly to the underlying button element.
 *
 * @returns {JSX.Element} The rendered Button component.
 */
export function Button({
  variant = 'primary',
  className,
  innerClassName,
  isLoading,
  children,
  ...props
}) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(className, (cls, renderProps) =>
        button({ ...renderProps, variant, className: cls }),
      )}
    >
      <div className={cn('wpchat:flex wpchat:items-center wpchat:gap-1.5', innerClassName)}>
        {isLoading && <LoadingIcon className='wpchat:h-4 wpchat:w-4 wpchat:animate-spin' />}
        {children}
      </div>
    </RACButton>
  );
}
