/**
 * Extracts and returns the initials from a full name string.
 * If the name contains multiple words, it uses the first letter of the first and last words.
 * If there's only one word, it returns the first letter of that word.
 *
 * @function
 * @param {string} name - The full name to extract initials from.
 * @returns {string} The uppercase initials (e.g., "John Doe" → "JD"). Returns an empty string if input is invalid.
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';

  const words = name
    .trim()
    .split(/\s+/) // Split on one or more spaces
    .filter(Boolean); // Remove empty strings

  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();

  const firstInitial = words[0][0];
  const lastInitial = words[words.length - 1][0];

  return (firstInitial + lastInitial).toUpperCase();
}
