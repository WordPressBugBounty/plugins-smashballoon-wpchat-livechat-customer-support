import { __, sprintf } from '@wordpress/i18n';

/**
 * Generic utility to create upgrade dialog data based on plan and limit type
 */
export const getUpgradeDialogData = (type, options = {}) => {
  const {
    isPro = false,
    currentCount = 0,
    maxLimit = 0,
    featureName = 'feature',
    pluralName = 'features',
    heading = 'feature',
    isFeatureAccess = false, // New flag for feature access vs limits
    features: customFeatures = {},
    ...customOptions
  } = options;

  const isAtLimit = isPro && currentCount >= maxLimit;

  // Base configuration
  const baseConfig = {
    title: sprintf(__('Upgrade %s', 'smashballoon-wpchat-livechat-customer-support'), heading),
    image: {
      imageName: '',
      imageAlt: '',
    },
    coupon: {
      couponTitle: __('WPChat Users get a 50% OFF', 'smashballoon-wpchat-livechat-customer-support'),
      couponDescription: __('auto-applied at checkout', 'smashballoon-wpchat-livechat-customer-support'),
    },
    primaryBtn: {
      primaryBtnText: __('Upgrade', 'smashballoon-wpchat-livechat-customer-support'),
      primaryBtnLink: window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing',
    },
    secondaryBtn: {
      secondaryBtnLink: window.wpChatAdmin?.urls?.pricing || 'https://wpchat.com/pricing',
      secondaryBtnText: __('Learn More', 'smashballoon-wpchat-livechat-customer-support'),
    },
    features: {
      featuresTitle: __('And get much more!', 'smashballoon-wpchat-livechat-customer-support'),
      featuresList: [
        __('Unlimited agents', 'smashballoon-wpchat-livechat-customer-support'),
        __('Unlimited FAQs', 'smashballoon-wpchat-livechat-customer-support'),
        __('AI-powered Smart Search', 'smashballoon-wpchat-livechat-customer-support'),
        __('Automated chat funnels', 'smashballoon-wpchat-livechat-customer-support'),
        __('Agent schedules & availability', 'smashballoon-wpchat-livechat-customer-support'),
        __('Detailed analytics', 'smashballoon-wpchat-livechat-customer-support'),
        __('Full chatbot customisation', 'smashballoon-wpchat-livechat-customer-support'),
        __('Remove WPChat branding', 'smashballoon-wpchat-livechat-customer-support'),
        __('Pro support', 'smashballoon-wpchat-livechat-customer-support'),
      ],
    },
  };

  // Free user upgrade
  if (!isPro) {
    return {
      ...baseConfig,
      features: {
        featuresTitle: customFeatures.featuresTitle || baseConfig.features.featuresTitle,
        featuresList: customFeatures.featuresList || baseConfig.features.featuresList,
      },
      primaryBtn: {
        ...baseConfig.primaryBtn,
      },
      ...customOptions,
    };
  }

  // Pro user hitting limits or needing feature access - upgrade to Elite
  if (isFeatureAccess) {
    return {
      ...baseConfig,
      features: {
        featuresTitle: customFeatures.featuresTitle || baseConfig.features.featuresTitle,
        featuresList: customFeatures.featuresList || baseConfig.features.featuresList,
      },
      primaryBtn: {
        ...baseConfig.primaryBtn,
      },
      ...customOptions,
    };
  }

  // Pro user hitting limits - upgrade to Elite
  return {
    ...baseConfig,
    title: sprintf(__('%s Limit Reached', 'smashballoon-wpchat-livechat-customer-support'), featureName),
    description: sprintf(
      __(
        'You have reached your limit of %d %s. Upgrade for unlimited %s and advanced features.',
        'smashballoon-wpchat-livechat-customer-support',
      ),
      maxLimit,
      pluralName,
      pluralName,
    ),
    features: {
      featuresTitle: customFeatures.featuresTitle || baseConfig.features.featuresTitle,
      featuresList: customFeatures.featuresList || baseConfig.features.featuresList,
    },
    primaryBtn: {
      ...baseConfig.primaryBtn,
    },
    ...customOptions,
  };
};

// Predefined configurations for common features
export const upgradeConfigs = {
  agents: {
    heading: 'to add unlimited Agents',
    featureName: 'Agent',
    pluralName: 'Agents',
    description: __(
      'Scale your support without limits – plus unlock features like smart search, funnels and powerful visibility controls',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/agent-modal-upsell.png',
      imageAlt: __('Agent modal upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  faqs: {
    heading: 'to get unlimited FAQs',
    featureName: 'FAQ',
    pluralName: 'FAQs',
    description: __(
      'Upgrade for limitless FAQs — plus AI-powered Smart Search, unlimited agents, and detailed analytics.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/faq-upsell.png',
      imageAlt: __('FAQ upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  smartSearchTokens: {
    heading: 'to get more Smart Search tokens',
    featureName: 'Smart Search Token',
    pluralName: 'Smart Search Tokens',
    description: __(
      'Scale smart search with more tokens — and unlock features like unlimited agents, analytics, and FAQs.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/smart-search-tokens-upsell.png',
      imageAlt: __('Smart Search Tokens Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  wpChatBranding: {
    heading: 'to remove WPChat branding',
    description: __(
      'Remove WPChat branding and unlock features like Smart Search, unlimited FAQs, and analytics.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    featureName: 'Remove WPChat Branding',
    pluralName: 'Remove WPChat Branding',
    image: {
      imageName: 'upsells/wp-branding-upsell.png',
      imageAlt: __('WP Branding Modal Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  colorPalette: {
    heading: 'to customize brand colors',
    featureName: 'Brand Color',
    pluralName: 'Brand Colors',
    description: __(
      'Match your chatbot to your brand — with features like Smart Search, unlimited FAQs, and analytics.',
      'smashballoon-wpchat-livechat-customer-support',
    ),

    image: {
      imageName: 'upsells/brand-color-upsell.png',
      imageAlt: __('Brand Color Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  sectionOrder: {
    heading: 'and customize section order',
    featureName: 'Section Order',
    pluralName: 'Section Order',
    description: __(
      'Put “Send a Message” or FAQs first — and unlock Smart Search, unlimited agents, and insights.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/section-order-upsell.png',
      imageAlt: __('Section Order Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  theme: {
    heading: 'to get one-click themes!',
    featureName: 'Theme',
    pluralName: 'Themes',
    description: __(
      'Switch instantly between Dark, Pastel, and more — with Pro features like Smart Search, unlimited FAQs, and analytics.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/themes-upsell.png',
      imageAlt: __('Theme Modal Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  icon: {
    heading: 'to unlock all icons',
    featureName: 'Icon',
    pluralName: 'Icons',
    description: __(
      'Upgrade to access every icon — plus AI-powered Smart Search, unlimited agents, and detailed analytics.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/chat-icon-upsell.png',
      imageAlt: __('Chat Icon Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  assistantAvatar: {
    heading: 'to unlock all avatars',
    featureName: 'Avatar',
    pluralName: 'Avatars',
    description: __(
      'Upgrade and access every avatar — plus AI-powered Smart Search, unlimited agents, and detailed analytics.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/assistant-avatar-upsell.png',
      imageAlt: __('Assistant Avatar Upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },
  analytics: {
    heading: 'access detailed analytics',
    featureName: 'Analytic',
    pluralName: 'Analytics',
    description: __(
      'See what’s working with advanced analytics — and unlock Smart Search, unlimited agents, and FAQs.',
      'smashballoon-wpchat-livechat-customer-support',
    ),
    image: {
      imageName: 'upsells/analytics-upsell.png',
      imageAlt: __('Analytic modal upsell', 'smashballoon-wpchat-livechat-customer-support'),
    },
  },

  // Add more as needed...
};
