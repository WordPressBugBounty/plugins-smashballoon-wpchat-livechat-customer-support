import { useState, useEffect, useRef } from 'react';

/**
 * Simple hook to get the content height of a container.
 * Returns the scrollHeight after content settles (no min/max clamping to avoid jumps).
 *
 * @param {React.RefObject} containerRef - Reference to the container element
 * @param {Array} dependencies - Dependencies to trigger recalculation
 * @returns {Object} { height }
 */
export function useWidgetHeight(containerRef, { dependencies = [] } = {}) {
  const [height, setHeight] = useState(null);
  const frameRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!containerRef?.current) return;

    // Cancel any pending frame/timeout
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait for next frame to ensure DOM has updated
    frameRef.current = requestAnimationFrame(() => {
      // Add a small delay to ensure React has fully committed DOM changes
      timeoutRef.current = setTimeout(() => {
        const contentHeight = containerRef.current?.scrollHeight;
        if (contentHeight) {
          setHeight(contentHeight);
        }
      }, 50);
    });

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return { height };
}

export default useWidgetHeight;
