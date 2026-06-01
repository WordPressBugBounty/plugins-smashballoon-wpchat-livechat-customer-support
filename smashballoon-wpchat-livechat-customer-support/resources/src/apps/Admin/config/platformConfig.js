import { __, sprintf } from '@wordpress/i18n';
import WhatsAppIcon from '@Assets/svg/platforms/whatsapp-color.svg?react';
import InstagramIcon from '@Assets/svg/platforms/instagram-color.svg?react';
import TelegramIcon from '@Assets/svg/platforms/telegram-color.svg?react';
import MessengerIcon from '@Assets/svg/platforms/messenger-color.svg?react';

/**
 * Centralized platform configuration
 * Single source of truth for all platform metadata, help content, and validation
 *
 * Note: helpInstructions use sprintf with %s placeholders for bold text.
 * The %s placeholders are wrapped with <b> tags and rendered by
 * the HelpTooltipContent component in PlatformValidation.jsx
 */
export const PLATFORM_CONFIG = {
  whatsapp: {
    slug: 'whatsapp',
    name: __('WhatsApp', 'smashballoon-wpchat-livechat-customer-support'),
    label: __('WhatsApp', 'smashballoon-wpchat-livechat-customer-support'),
    icon: WhatsAppIcon,
    placeholder: __('+1 (555) 000-0000', 'smashballoon-wpchat-livechat-customer-support'),
    inputType: 'phone',
    helpTitle: __('Where to find your WhatsApp number', 'smashballoon-wpchat-livechat-customer-support'),
    helpInstructions: [
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Open %1$sWhatsApp%2$s and go to %1$sSettings%2$s', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Tap your %1$sprofile%2$s at the top. Your phone number is displayed there.', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>')
    ],
    helpFooter: null,
    helpFooterText: null,
    prefix: null
  },
  instagram: {
    slug: 'instagram',
    name: __('Instagram', 'smashballoon-wpchat-livechat-customer-support'),
    label: __('Instagram', 'smashballoon-wpchat-livechat-customer-support'),
    icon: InstagramIcon,
    placeholder: __('username', 'smashballoon-wpchat-livechat-customer-support'),
    inputType: 'text',
    helpTitle: __('Where to find the Instagram Username', 'smashballoon-wpchat-livechat-customer-support'),
    helpInstructions: [
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Open the %1$sInstagram%2$s app', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Tap your %1$sprofile%2$s (bottom right)', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Your username is at the top of the screen — it starts with %1$s@%2$s', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>')
    ],
    helpFooter: null,
    helpFooterText: null,
    prefix: '@'
  },
  telegram: {
    slug: 'telegram',
    name: __('Telegram', 'smashballoon-wpchat-livechat-customer-support'),
    label: __('Telegram', 'smashballoon-wpchat-livechat-customer-support'),
    icon: TelegramIcon,
    placeholder: __('username', 'smashballoon-wpchat-livechat-customer-support'),
    inputType: 'text',
    helpTitle: __('Where to find the Telegram Username', 'smashballoon-wpchat-livechat-customer-support'),
    helpInstructions: [
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Open the %1$sTelegram%2$s app on your phone or desktop', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Tap the %1$s☰ menu%2$s (top left on Android) or go to %1$sSettings%2$s (iOS/desktop)', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Tap on your %1$sprofile%2$s at the top. Look for %1$sUsername%2$s — it starts with @', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>')
    ],
    helpFooter: __('Don\'t have a username?', 'smashballoon-wpchat-livechat-customer-support'),
    helpFooterText: __('In the same profile section, you can tap "Username" and create one', 'smashballoon-wpchat-livechat-customer-support'),
    prefix: '@'
  },
  messenger: {
    slug: 'messenger',
    name: __('Messenger', 'smashballoon-wpchat-livechat-customer-support'),
    label: __('Messenger', 'smashballoon-wpchat-livechat-customer-support'),
    icon: MessengerIcon,
    placeholder: __('username or page ID', 'smashballoon-wpchat-livechat-customer-support'),
    inputType: 'text',
    helpTitle: __('Where to find the Facebook page username', 'smashballoon-wpchat-livechat-customer-support'),
    helpInstructions: [
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Open %1$sFacebook%2$s and go to your %1$sPage%2$s', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Look at the %1$sURL%2$s — it\'s the part after %1$sfacebook.com/%2$s', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>'),
      /* translators: %1$s and %2$s are opening/closing bold tags */
      sprintf(__('Example: facebook.com/coffeeshop → username is %1$scoffeeshop%2$s', 'smashballoon-wpchat-livechat-customer-support'), '<b>', '</b>')
    ],
    helpFooter: __('Don\'t have a username?', 'smashballoon-wpchat-livechat-customer-support'),
    helpFooterText: __('You can use your Page ID instead. Look for the long number in the URL (e.g., facebook.com/profile.php?id=123456789)', 'smashballoon-wpchat-livechat-customer-support'),
    prefix: '@'
  }
};

/**
 * Get platform configuration by slug
 * @param {string} slug - Platform slug
 * @returns {Object} Platform configuration
 */
export const getPlatformConfig = (slug) => {
  return PLATFORM_CONFIG[slug] || null;
};

/**
 * Get all platform configurations as array
 * @returns {Array} Array of platform configurations
 */
export const getAllPlatforms = () => {
  return Object.values(PLATFORM_CONFIG);
};

/**
 * Get enabled platforms as array
 * @param {Array<string>} enabledSlugs - Array of enabled platform slugs
 * @returns {Array} Array of enabled platform configurations
 */
export const getEnabledPlatforms = (enabledSlugs = []) => {
  return enabledSlugs.map(slug => PLATFORM_CONFIG[slug]).filter(Boolean);
};

/**
 * Default platform slugs shown during onboarding preview when no channels are configured
 */
export const DEFAULT_ONBOARDING_PLATFORMS = ['whatsapp', 'instagram', 'telegram'];

/**
 * Get default platform names for onboarding preview
 * @returns {Array<string>} Array of platform names (translated)
 */
export const getDefaultOnboardingPlatformNames = () => {
  return DEFAULT_ONBOARDING_PLATFORMS
    .map(slug => PLATFORM_CONFIG[slug]?.name)
    .filter(Boolean);
};
