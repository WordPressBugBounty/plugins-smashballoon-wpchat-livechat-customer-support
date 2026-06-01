import { composeRenderProps } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

export const focusRing = tv({
  base: 'wpchat:outline wpchat:outline-wp-light-blue-500-20',
  variants: {
    isFocusVisible: {
      false: 'wpchat:outline-0',
      true: 'wpchat:outline-4',
    },
  },
});

/**
 * Merges Tailwind classes using `twMerge` and `composeRenderProps`.
 * @param {string | ((v: any) => string) | undefined} className - The class name or a function returning a class name.
 * @param {string} tw - Additional Tailwind classes to merge.
 * @returns {string | ((v: any) => string)} - The merged class name or a function returning a class name.
 */
export function composeTailwindRenderProps(className, tw) {
  return composeRenderProps(className, (className) => twMerge(tw, className));
}
