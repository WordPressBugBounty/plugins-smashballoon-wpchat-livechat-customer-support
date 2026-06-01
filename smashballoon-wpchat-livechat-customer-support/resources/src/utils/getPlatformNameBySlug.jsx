import { __ } from '@wordpress/i18n';

/**
 * Get translated platform name by slug.
 *
 * @param {string} slug - The platform slug (e.g., 'whatsapp', 'telegram').
 * @returns {string} - The translated platform name.
 */
export function getPlatformNameBySlug(slug) {
  switch (slug) {
    case 'whatsapp':
      return __('WhatsApp', 'smashballoon-wpchat-livechat-customer-support');
    case 'telegram':
      return __('Telegram', 'smashballoon-wpchat-livechat-customer-support');
    case 'messenger':
      return __('Messenger', 'smashballoon-wpchat-livechat-customer-support');
    case 'instagram':
      return __('Instagram', 'smashballoon-wpchat-livechat-customer-support');
    default:
      return __('Unknown', 'smashballoon-wpchat-livechat-customer-support');
  }
}