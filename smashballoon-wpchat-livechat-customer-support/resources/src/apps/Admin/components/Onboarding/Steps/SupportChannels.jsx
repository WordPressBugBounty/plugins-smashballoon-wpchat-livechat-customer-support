import React, { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import { useTransitions } from '@Hooks/useTransitions';
import OnboardingPreview from '../OnboardingPreview';
import SvgLoader from '@Components/SvgLoader';
import { getAllPlatforms, getDefaultOnboardingPlatformNames } from '@AConfig/platformConfig';
import PlatformFieldRow from '@AC/Agent/PlatformFieldRow';
import { useFieldValidation } from '@AH/useFieldValidation';

// Get platforms from centralized config
const PLATFORMS = getAllPlatforms().map(platform => ({
  ...platform,
  id: platform.slug
}));

// Main component
const SupportChannels = ({ value = {}, onChange, showPreview = true, hasInteracted: initialInteracted = {}, onInteractionChange }) => {
  const transition = useTransitions({ type: 'slideUpFade' });

  // Initialize channels with default structure
  const channels = useMemo(() => value || {
    whatsapp: { enabled: false, value: '' },
    instagram: { enabled: false, value: '' },
    telegram: { enabled: false, value: '' },
    messenger: { enabled: false, value: '' }
  }, [value]);

  // Use the field validation hook
  const {
    handleFieldChange,
    handleFieldBlur,
    getFieldValidationState,
  } = useFieldValidation({
    initialInteracted: initialInteracted,
    validationDelay: 1000,
    onInteractionChange: onInteractionChange,
  });

  // Handle channel value changes
  const handleChannelChange = useCallback((platformId, newValue) => {
    const updatedChannels = {
      ...channels,
      [platformId]: {
        enabled: !!newValue,
        value: newValue || ''
      }
    };
    onChange(updatedChannels);

    // Trigger validation
    handleFieldChange(platformId, newValue);
  }, [channels, onChange, handleFieldChange]);

  // Check if at least one channel is configured
  const hasAtLeastOneChannel = useMemo(() =>
    Object.values(channels).some(channel => channel.enabled && channel.value),
    [channels]
  );

  // Get enabled platform names for preview (default to configured platforms if none)
  const enabledPlatforms = useMemo(() => {
    const enabled = Object.entries(channels)
      .filter(([_, channel]) => channel.enabled && channel.value)
      .map(([id]) => PLATFORMS.find(p => p.id === id)?.name || id);
    return enabled.length > 0 ? enabled : getDefaultOnboardingPlatformNames();
  }, [channels]);

  return (
    <div className='wpchat:w-full'>
        <div className='wpchat:flex wpchat:flex-wrap wpchat:mb-10'>
          {PLATFORMS.map((platform, index) => {
            const channel = channels[platform.id] || { enabled: false, value: '' };
            const validationState = getFieldValidationState(
              platform.id,
              channel.value,
              platform.inputType === 'phone' ? 'phone' : 'username'
            );

            return (
              <PlatformFieldRow
                key={platform.id}
                platform={platform}
                value={channel.value}
                onChange={(newValue) => handleChannelChange(platform.id, newValue)}
                onBlur={() => handleFieldBlur(platform.id)}
                validationStatus={validationState.status}
                validationMessage={validationState.message}
                isLast={index === PLATFORMS.length - 1}
              />
            );
          })}
        </div>
              {showPreview && (
        <OnboardingPreview
          title={__('Support Channels', 'smashballoon-wpchat-livechat-customer-support')}
          description={
              __('The platforms you add here will be added when a user wants to get in touch with you', 'smashballoon-wpchat-livechat-customer-support')
          }
          centerOnMobile={true}
        >
          <div className='wpchat:relative'>
            <SvgLoader name="OnboardingHome" className='wpchat:h-[322px]' />
             <div className='wpchat:absolute wpchat:top-39 wpchat:start-19 wpchat:max-w-3xs wpchat:flex wpchat:flex-wrap'>
              {enabledPlatforms.map((platformName) => (
              <div
                key={platformName}
                className='wpchat:me-1 wpchat:mb-1.5 wpchat:rounded-2xl wpchat:border wpchat:border-solid wpchat:bg-transparent wpchat:px-3 wpchat:py-1 wpchat:text-xs wpchat:text-[#710015]'
              >
                {platformName}
              </div>
            ))}
             </div>
          </div>
        </OnboardingPreview>
      )}
    </div>
  );
};

export default SupportChannels;
