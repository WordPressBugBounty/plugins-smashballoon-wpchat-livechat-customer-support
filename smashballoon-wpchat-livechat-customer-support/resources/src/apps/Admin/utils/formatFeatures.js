import { __ } from '@wordpress/i18n';

export function formatFeatures(features) {
  const map = {
    "wpchat.faq.basic": __("FAQ (Basic)", "smashballoon-wpchat-livechat-customer-support"),
    "wpchat.faqs": __("FAQs", "smashballoon-wpchat-livechat-customer-support"),
    "wpchat.analytics.basic": __("Analytics (Basic)", "smashballoon-wpchat-livechat-customer-support"),
    "wpchat.analytics.advanced": __("Analytics (Advanced)", "smashballoon-wpchat-livechat-customer-support"),
    "wpchat.customizer.full": __("Customizer (Full)", "smashballoon-wpchat-livechat-customer-support"),
    "wpchat.funnels": __("Funnels", "smashballoon-wpchat-livechat-customer-support"),
    "wpchat.branding.white_label": __("White Label Branding", "smashballoon-wpchat-livechat-customer-support"),
  };

  // Deduplicate and map
  return [...new Set(features)].map(key => map[key] || key);
}