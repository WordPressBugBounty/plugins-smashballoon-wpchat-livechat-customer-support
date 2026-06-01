/**
 * Hook to detect RTL (Right-to-Left) direction.
 *
 * @returns {boolean} True if the document direction is RTL
 */
export const useRTL = () => {
  return document.documentElement.dir === 'rtl';
};

/**
 * Helper function to get RTL-aware x value for motion animations.
 * Flips the sign of x values when in RTL mode.
 *
 * @param {number} value - The x value for LTR direction
 * @param {boolean} isRTL - Whether the current direction is RTL
 * @returns {number} The adjusted x value (negated for RTL)
 */
export const rtlX = (value, isRTL) => {
  return isRTL ? -value : value;
};

/**
 * Hook that returns an RTL-aware x value helper.
 *
 * @returns {function} A function that takes an x value and returns RTL-adjusted value
 */
export const useRTLValue = () => {
  const isRTL = useRTL();
  return (value) => rtlX(value, isRTL);
};
