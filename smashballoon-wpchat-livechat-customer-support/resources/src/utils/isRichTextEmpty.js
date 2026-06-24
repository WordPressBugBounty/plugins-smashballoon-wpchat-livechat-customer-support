/**
 * Determine whether a rich-text (HTML) value has no visible content.
 *
 * A TipTap editor that the user has cleared still serialises to markup such as
 * `<p></p>`, so a plain `value.trim() === ''` check is not enough to tell that a
 * field is empty. This strips tags and collapses whitespace (including the
 * non-breaking space in its named `&nbsp;`, decimal `&#160;` and hex `&#xA0;`
 * forms) to decide whether any visible text remains.
 *
 * @param {string} html - The HTML string to test.
 * @returns {boolean} `true` when there is no visible text content.
 */
export function isRichTextEmpty(html) {
  if (!html || typeof html !== 'string') return true;

  const text = html
    .replace(/<[^>]*>/g, '') // strip tags
    .replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, ' ') // treat non-breaking spaces (named/decimal/hex) as whitespace
    .trim();

  return text === '';
}
