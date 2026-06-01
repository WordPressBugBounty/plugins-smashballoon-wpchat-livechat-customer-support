import React from 'react';
import { cn } from '@Utils/cn';

/**
 * Renders a skeleton loading block, typically used as a placeholder
 * while content is loading. Useful for improving perceived performance.
 *
 * @param {Object} props - The component props.
 * @param {string} [props.className=''] - Optional additional class names for styling the skeleton block.
 *
 * @returns {JSX.Element} The rendered SkeletonBlock component.
 */
export default function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={cn('wpchat:animate-pulse wpchat:rounded wpchat:bg-gray-200', className)}
      aria-hidden='true'
    />
  );
}
