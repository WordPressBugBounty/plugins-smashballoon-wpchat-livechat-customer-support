import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally join class names and merge Tailwind CSS classes.
 * 
 * Combines `clsx` and `tailwind-merge` to provide conflict-free, dynamic Tailwind class strings.
 * Useful for composing class names in a clean and expressive way.
 * 
 * @param {...(string | number | null | false | undefined | Record<string, boolean>)} inputs - Class names, objects, or falsy values
 * @returns {string} A merged class name string with conflicting Tailwind classes resolved
 */
export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}