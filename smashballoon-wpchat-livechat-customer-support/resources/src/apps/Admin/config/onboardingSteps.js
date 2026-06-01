import { __ } from '@wordpress/i18n';
import SelectTheme from '@AC/Onboarding/Steps/SelectTheme';
import SupportChannels from '@AC/Onboarding/Steps/SupportChannels';
import VisibilityTabs from '@AC/Visibility/VisibilityTabs';
import ConfigureFeatures from '@AC/Onboarding/Steps/ConfigureFeatures';
import FinalStep from '@AC/Onboarding/Steps/FinalStep';
import VisibilityTabsPro from '@ACPro/Visibility/VisibilityTabsPro';
import { isPro } from '@Utils/isPro';

const allSteps = [
  {
    id: 'channels',
    title: __('Add your support channels', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Add at least one channel. You can always add more later.', 'smashballoon-wpchat-livechat-customer-support'),
    component: SupportChannels,
    fieldName: 'agentPlatforms',
  },
  {
    id: 'theme',
    title: __('Select a theme', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Select which theme would you like to choose', 'smashballoon-wpchat-livechat-customer-support'),
    component: SelectTheme,
    fieldName: 'selectedTheme',
    visibleFor: ['pro', 'free'],
  },
  {
    id: 'visibility',
    title: __('Configure Visibility', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Which pages would you want the chatbot to be displayed in', 'smashballoon-wpchat-livechat-customer-support'),
    component: isPro ? VisibilityTabsPro : VisibilityTabs,
    fieldName: 'visibilitySettings',
    contentClassName: 'wpchat:pb-6',
  },
  {
    id: 'features',
    component: ConfigureFeatures,
    bodyClassName: 'wpchat:px-0 wpchat:pt-0',
    visibleFor: ['free'],
  },
  {
    id: 'final',
    component: FinalStep,
    bodyClassName: 'wpchat:px-0 wpchat:pt-0',
    containerClassName: 'wpchat:!bg-transparent wpchat:!shadow-none',
  },
  // Add more steps as needed
];

/**
 * Current plan derived from build-time flag.
 */
export const PLAN = isPro ? 'pro' : 'free';

/**
 * Returns steps filtered by `visibleFor`.
 * - Omit `visibleFor` to show step for both plans
 * - Use `visibleFor: ['pro']` or `['free']` to gate
 *
 * @param {('pro'|'free')} [plan=PLAN]
 * @returns {Array} Filtered steps
 */
export function getStepsForPlan(plan = PLAN) {
  return allSteps.filter((step) => {
    if (Array.isArray(step.visibleFor) && step.visibleFor.length > 0) {
      return step.visibleFor.includes(plan);
    }
    return true;
  });
}

export const STEPS = getStepsForPlan();

export const isLastStep = (currentStep) => currentStep === STEPS.length - 1;
export const isFirstStep = (currentStep) => currentStep === 0;
