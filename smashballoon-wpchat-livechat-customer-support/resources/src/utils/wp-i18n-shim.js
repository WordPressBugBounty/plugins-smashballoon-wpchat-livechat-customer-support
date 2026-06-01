/**
 * Shim for @wordpress/i18n to ensure it works even if loaded out of order or missing.
 *
 * This provides fallback implementations that match WordPress i18n API signatures.
 * Uses lazy evaluation to check for wp.i18n at call time, not load time.
 */

/**
 * Translate a string.
 * @param {string} text - Text to translate
 * @param {string} domain - Text domain (optional)
 * @returns {string} Translated text or original text if translation unavailable
 */
const __ = (text, domain) => {
  const wpI18n = window.wp?.i18n;
  return wpI18n?.__?.(text, domain) ?? text;
};

/**
 * Translate a string with context.
 * @param {string} text - Text to translate
 * @param {string} context - Context for the translation
 * @param {string} domain - Text domain (optional)
 * @returns {string} Translated text or original text if translation unavailable
 */
const _x = (text, context, domain) => {
  const wpI18n = window.wp?.i18n;
  return wpI18n?._x?.(text, context, domain) ?? text;
};

/**
 * Translate and retrieve the singular or plural form.
 * @param {string} single - Singular form
 * @param {string} plural - Plural form
 * @param {number} number - Number to determine singular vs plural
 * @param {string} domain - Text domain (optional)
 * @returns {string} Translated singular or plural form
 */
const _n = (single, plural, number, domain) => {
  const wpI18n = window.wp?.i18n;
  return wpI18n?._n?.(single, plural, number, domain) ?? (number === 1 ? single : plural);
};

/**
 * Translate and retrieve the singular or plural form with context.
 * @param {string} single - Singular form
 * @param {string} plural - Plural form
 * @param {number} number - Number to determine singular vs plural
 * @param {string} context - Context for the translation
 * @param {string} domain - Text domain (optional)
 * @returns {string} Translated singular or plural form
 */
const _nx = (single, plural, number, context, domain) => {
  const wpI18n = window.wp?.i18n;
  return wpI18n?._nx?.(single, plural, number, context, domain) ?? (number === 1 ? single : plural);
};

/**
 * Format a string with sprintf-style placeholders.
 * @param {string} format - Format string
 * @param {...any} args - Arguments to substitute
 * @returns {string} Formatted string
 */
const sprintf = (format, ...args) => {
  const wpI18n = window.wp?.i18n;
  if (wpI18n?.sprintf) {
    return wpI18n.sprintf(format, ...args);
  }

  // Fallback: Basic sprintf implementation supporting common patterns
  // Handle positional arguments like %1$s, %2$d
  let result = format;
  let nextArg = 0;

  // Replace positional arguments (%1$s, %2$d, etc.)
  result = result.replace(/%(\d+)\$([sd])/g, (match, position, type) => {
    const index = parseInt(position) - 1;
    if (index >= 0 && index < args.length) {
      const value = args[index];
      return type === 'd' ? parseInt(value) || 0 : String(value);
    }
    return match;
  });

  // Replace non-positional arguments (%s, %d)
  result = result.replace(/%([sd])/g, (match, type) => {
    if (nextArg >= args.length) return match;
    const value = args[nextArg++];
    return type === 'd' ? parseInt(value) || 0 : String(value);
  });

  return result;
};

export { __, _x, _n, _nx, sprintf };
