/**
 * UTM Helper utility for adding tracking parameters to URLs
 */

/**
 * Add UTM parameters to a URL
 *
 * @param {string} url - The base URL
 * @param {Object} params - UTM parameters object with utm_source, utm_medium, utm_campaign, etc.
 * @returns {string} The URL with UTM parameters appended
 */
export const addUtmParams = (url, params = {}) => {
  if (!url) return '';

  const utmParams = new URLSearchParams();

  // Add each UTM parameter if it exists
  Object.entries(params).forEach(([key, value]) => {
    if (value && key.startsWith('utm_')) {
      utmParams.append(key, value);
    }
  });

  // Return original URL if no UTM params to add
  if (!utmParams.toString()) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${utmParams.toString()}`;
};