/**
 * Convert an HTML string to plain text (tags stripped, entities decoded).
 *
 * Useful for rendering rich-text content as a plain preview/excerpt, e.g. the
 * FAQ answer column in the admin list.
 *
 * @param {string} html - The HTML string.
 * @returns {string} The plain-text content.
 */
export function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
