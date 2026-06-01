import { useEffect } from 'react';

/**
 * useBodyBackground
 * Hook to temporarily set body background color.
 *
 * @param {string} color - background color to set
 */
export function useBodyBackground(color = '#fff') {
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = color;

    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, [color]);
}
