import { useMemo } from 'react';
import useAgentsStore from '@DataStore/agents/agentsStore';
import useFaqsStore from '@DataStore/faqs/faqsStore';
import useFunnelsStore from '@DataStore/funnels/funnelsStore';

/**
 * Hook for checking entitlements and limits
 */
export function useEntitlements() {
  const { agents } = useAgentsStore();
  const { pagination } = useFaqsStore();
  const { funnels } = useFunnelsStore();

  const entitlement = window.wpChatAdmin?.entitlement || {};
  const limits = entitlement.limits || {};
  const features = entitlement.features || {};
  const plan = entitlement.plan || 'Free';
  const isPro = window.wpChatAdmin?.features?.is_pro || false;

  // Get specific limits
  const getLimit = (limitKey) => {
    return limits[limitKey] || 0;
  };

  // Check if feature is enabled
  const hasFeature = (featureKey) => {
    return features[featureKey] === true;
  };

  // Generic limit checker
  const checkLimit = (limitKey, currentCount) => {
    const maxLimit = getLimit(limitKey);
    
    // If limit is -1, user has unlimited access
    if (maxLimit === -1) {
      return {
        current: currentCount,
        max: maxLimit,
        canCreateMore: true,
        remaining: Infinity,
        isAtLimit: false,
        isUnlimited: true
      };
    }
    
    // If limit is 0, user can't create anything regardless of current count
    if (maxLimit === 0) {
      return {
        current: currentCount,
        max: maxLimit,
        canCreateMore: false,
        remaining: 0,
        isAtLimit: true,
        isUnlimited: false
      };
    }
    
    const canCreateMore = currentCount < maxLimit;
    const remaining = Math.max(0, maxLimit - currentCount);

    return {
      current: currentCount,
      max: maxLimit,
      canCreateMore,
      remaining,
      isAtLimit: !canCreateMore,
      isUnlimited: false
    };
  };

  // Check agent limits (specific implementation)
  const agentLimits = useMemo(() => {
    const currentCount = Array.isArray(agents) ? agents.length : 0;
    return checkLimit('wpchat.agents.limit', currentCount);
  }, [agents, limits]);

  // Check FAQ limits (specific implementation)
  const faqLimits = useMemo(() => {
    const currentCount = pagination?.totalFaqs || 0;
    return checkLimit('wpchat.faqs.limit', currentCount);
  }, [pagination, limits]);

  // Check Funnel limits (specific implementation)
  const funnelLimits = useMemo(() => {
    const currentCount = Array.isArray(funnels) ? funnels.length : 0;
    return checkLimit('wpchat.funnels.limit', currentCount);
  }, [funnels, limits]);

  // Check if user has Funnels entitlement
  const hasFunnelsEntitlement = useMemo(() => {
    return hasFeature('wpchat.funnels');
  }, [features]);

  // Check if user has FAQs entitlement
  const hasFaqsEntitlement = useMemo(() => {
    return hasFeature('wpchat.faqs');
  }, [features]);

  // Check if user has full Customizer entitlement
  const hasFullCustomizerEntitlement = useMemo(() => {
    return hasFeature('wpchat.customizer.full');
  }, [features]);

  // Check if user has White Label entitlement
  const hasWhiteLabelEntitlement = useMemo(() => {
    return hasFeature('wpchat.branding.white_label');
  }, [features]);

  return {
    plan,
    limits,
    features,
    isPro,
    getLimit,
    hasFeature,
    checkLimit,
    agentLimits,
    faqLimits,
    funnelLimits,
    hasFunnelsEntitlement,
    hasFaqsEntitlement,
    hasFullCustomizerEntitlement,
    hasWhiteLabelEntitlement,
  };
}
