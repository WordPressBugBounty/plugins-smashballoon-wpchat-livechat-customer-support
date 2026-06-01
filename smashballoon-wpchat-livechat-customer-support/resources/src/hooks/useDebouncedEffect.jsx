import { useEffect } from 'react';

/**
 * A custom React hook that delays invoking the provided effect until
 * after a specified delay has passed since the last dependency change.
 *
 * Useful for debouncing expensive side effects like API calls or
 * localStorage writes that would otherwise run on every state change.
 *
 * @param {() => void | (() => void)} effect - The effect callback function. 
 *   Can optionally return a cleanup function.
 * @param {React.DependencyList} deps - The list of dependencies that trigger the effect.
 * @param {number} delay - The debounce delay in milliseconds.
 *
 * @example
 * useDebouncedEffect(() => {
 *   // Expensive computation or API call
 *   console.log("Debounced effect executed");
 * }, [searchQuery], 500);
 */
export function useDebouncedEffect(effect, deps, delay) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);

    return () => clearTimeout(handler);
  }, [...deps, delay]);
}