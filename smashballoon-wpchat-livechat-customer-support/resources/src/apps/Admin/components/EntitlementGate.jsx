import React from 'react';
import { __ } from '@wordpress/i18n';
import UpgradeToPro from './UpgradeToPro';

/**
 * EntitlementGate component that wraps features and shows upgrade prompts
 * when the current plan doesn't support the feature.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.feature - Feature key to check (e.g., 'faq.smart_search').
 * @param {boolean} [props.requiresPro] - Whether this feature requires any Pro plan.
 * @param {string} [props.plan] - Specific plan required (Pro/Business/etc).
 * @param {JSX.Element} props.children - Content to show when feature is available.
 * @param {Object} [props.fallback] - Custom fallback component props.
 * @param {string} [props.fallback.title] - Custom title for upgrade prompt.
 * @param {string} [props.fallback.description] - Custom description for upgrade prompt.
 * @param {Array} [props.fallback.features] - Custom features list for upgrade prompt.
 *
 * @returns {JSX.Element} Either the children or an upgrade prompt.
 */
export default function EntitlementGate({
  feature,
  requiresPro = false,
  plan = null,
  children,
  fallback = {}
}) {
  const entitlement = window.wpChatAdmin?.entitlement || {};
  const features = entitlement.features || {};

  // Check if user has access to this feature
  const hasAccess = () => {
    if (requiresPro && !window.wpChatAdmin?.features?.is_pro) {
      return false;
    }

    if (plan && entitlement.plan !== plan) {
      return false;
    }

    if (feature && !features[feature]) {
      return false;
    }

    return true;
  };

  if (hasAccess()) {
    return children;
  }
	if(!fallback.title) {
		return null;
	}
  // Show upgrade prompt
  const defaultFallback = {
    title: __('Unlock Pro Features', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Upgrade to access advanced features and remove limitations.', 'smashballoon-wpchat-livechat-customer-support'),
    features: [
      {
        title: __('Advanced Analytics', 'smashballoon-wpchat-livechat-customer-support'),
        description: __('Get detailed insights into your chat performance.', 'smashballoon-wpchat-livechat-customer-support'),
      },
      {
        title: __('Smart Search', 'smashballoon-wpchat-livechat-customer-support'),
        description: __('Intelligent FAQ search with AI-powered suggestions.', 'smashballoon-wpchat-livechat-customer-support'),
      },
      {
        title: __('Priority Support', 'smashballoon-wpchat-livechat-customer-support'),
        description: __('Get faster responses from our support team.', 'smashballoon-wpchat-livechat-customer-support'),
      },
    ],
  };

  const upgradeProps = { ...defaultFallback, ...fallback };

  return (
    <UpgradeToPro
      title={upgradeProps.title}
      description={upgradeProps.description}
      btn1={true}
      features={upgradeProps.features}
    />
  );
}
