import { __ } from '@wordpress/i18n';

export const freePlatforms = [
  {
    slug: 'whatsapp',
    label: __('WhatsApp', 'smashballoon-wpchat-livechat-customer-support'),
    placeholder: __('Phone number', 'smashballoon-wpchat-livechat-customer-support'),
  },
    {
    slug: 'telegram',
    label: __('Telegram', 'smashballoon-wpchat-livechat-customer-support'),
    placeholder: __('Phone Number or Username', 'smashballoon-wpchat-livechat-customer-support'),
  },
  {
    slug: 'messenger',
    label: __('Facebook Messenger', 'smashballoon-wpchat-livechat-customer-support'),
    placeholder: __('Messenger ID or Username', 'smashballoon-wpchat-livechat-customer-support'),
  },
  {
    slug: 'instagram',
    label: __('Instagram', 'smashballoon-wpchat-livechat-customer-support'),
    placeholder: __('Username', 'smashballoon-wpchat-livechat-customer-support'),
  },
];
