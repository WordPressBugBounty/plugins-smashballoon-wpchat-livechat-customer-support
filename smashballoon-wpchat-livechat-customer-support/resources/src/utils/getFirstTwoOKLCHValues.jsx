/**
 * Extracts the first two OKLCH color values from the given input.
 *
 * @param {string} input - The input string containing OKLCH color values.
 * @returns {Array<number>} An array containing the first two numeric OKLCH values found in the input.
 */
export function getFirstTwoOKLCHValues(input) {
  // Extract content inside parentheses
  const match = input.match(/oklch\(([^)]+)\)/i);
  if (!match) return null;

  // Split values by spaces
  const values = match[1].trim().split(/\s+/);

  // Map first two values:
  const firstTwo = values.slice(0, 2).map((val) => {
    return parseFloat(val);
  });

  return firstTwo;
}
