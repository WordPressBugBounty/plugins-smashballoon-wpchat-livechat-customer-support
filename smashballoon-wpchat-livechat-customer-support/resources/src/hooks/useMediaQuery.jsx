import { useEffect, useState } from 'react';

/**
 * Custom hook to track whether a CSS media query matches the current viewport.
 *
 * @param {string} query - The media query string, e.g., "(min-width: 768px)".
 * @returns {boolean} `true` if the media query matches, otherwise `false`.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);
    updateMatch();

    mediaQuery.addEventListener('change', updateMatch);
    return () => mediaQuery.removeEventListener('change', updateMatch);
  }, [query]);

  return matches;
}
