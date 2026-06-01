import { __ } from '@wordpress/i18n';
import { getInitials } from '@Utils/getInitials';

/**
 * Generates a fallback avatar representation.
 *
 * @function
 * @param {string} name - The full name of the user.
 * @returns {object} An object containing either a `text` or `content` property, plus theme overrides.
 */
export function getAvatarFallback(name, theme_slug) {

  return {
    text: name ? getInitials(name) : __('SB', 'smashballoon-wpchat-livechat-customer-support'),
    ...theme_slug,
  };
}