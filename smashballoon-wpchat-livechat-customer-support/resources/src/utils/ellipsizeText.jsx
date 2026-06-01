/**
 * Truncates a given text to a specified number of characters and appends an ellipsis ("...") if truncated.
 *
 * @param {string} [text=''] - The input text to be truncated. If not provided, defaults to an empty string.
 * @param {number} [maxChars=10] - The maximum number of characters to keep before adding an ellipsis.
 *                                 If less than 1 or invalid, defaults to 10.
 * @returns {string} The original text if its length is less than or equal to maxChars,
 *                   otherwise a truncated version with an ellipsis appended.
 *
 * @example
 * ellipsizeText('Hello World!', 5); // Returns: 'Hello...'
 * ellipsizeText('Short', 10);        // Returns: 'Short'
 * ellipsizeText();                   // Returns: ''
 */
export function ellipsizeText(text = '', maxChars = 10) {
  const str = String(text);
  const len = Math.max(1, Number(maxChars) || 10);

  if (str.length <= len) return str;

  return str.slice(0, len) + '...';
}
