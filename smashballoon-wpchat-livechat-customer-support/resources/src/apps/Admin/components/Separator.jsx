import React from 'react';
import { tv } from 'tailwind-variants';
import { cn } from '@Utils/cn';

const separator = tv({
  base: 'wpchat:border-gray-200 wpchat:border-t-0',
  variants: {
    variant: {
      default: 'wpchat:mt-8 wpchat:mb-6',
      fullWidth: 'wpchat:-mx-5 wpchat:mt-7 wpchat:mb-5',
    },
    style: {
      solid: '',
      dashed: 'wpchat:border-dashed',
    },
  },
  defaultVariants: {
    variant: 'default',
    style: 'solid',
  },
});

/**
 * Separator Component
 *
 * Renders a horizontal rule (`<hr>`) with variant-based styling.
 *
 * @param {Object} props - The component props.
 * @param {string} [props.className] - Additional class names.
 * @param {'default' | 'fullWidth'} [props.variant] - Layout variant of the separator.
 * @param {'solid' | 'dashed'} [props.style] - Border style of the separator.
 * @returns {JSX.Element}
 */
export default function Separator({ className, variant = 'default', style = 'solid' }) {
  return <hr className={cn(separator({ variant, style }), className)} />;
}