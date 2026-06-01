import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import { validatePlatformValue } from '@AC/Agent/PlatformValidation';
import OnboardingLayout from '@AC/Onboarding/OnboardingLayout';
import OnboardingNavigation from '@AC/Onboarding/OnboardingNavigation';
import Step from '@AC/Onboarding/Step';
import { Toast } from '@AC/ui/Toast';
import useLicenseStore from '@DataStore/license/licenseStore';
import useOnboardingStore from '@DataStore/settings/onboardingStore';
import { useDebouncedEffect } from '@Hooks/useDebouncedEffect';
import { useTransitions } from '@Hooks/useTransitions';
import { isPro } from '@Utils/isPro';
import { STEPS } from '../config/onboardingSteps';

// Local storage utility functions for onboarding persistence
const ONBOARDING_STORAGE_KEY = 'wpchat_onboarding_state';

const saveOnboardingToLocalStorage = (step, data, interactionState = {}) => {
  try {
    const storageData = {
      currentStep: step,
      formData: data,
      hasInteracted: interactionState,
      timestamp: Date.now(),
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.warn('Failed to save onboarding state to localStorage:', error);
  }
};

const loadOnboardingFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Check if data is not too old (24 hours)
      const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
      if (!isExpired) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load onboarding state from localStorage:', error);
  }
  return null;
};

const clearOnboardingFromLocalStorage = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear onboarding state from localStorage:', error);
  }
};

/**
 * Onboarding component guides new users through the initial setup or
 * key features of the application to ensure a smooth start.
 *
 * @component
 * @returns {JSX.Element} The rendered Onboarding component.
 */
const Onboarding = () => {
  const onboardingStore = useOnboardingStore();
  const {
    agentPlatforms: platformsData,
    selectedTheme,
    visibilitySettings,
    newsletterEmail,
    newsletterSubscribed,
    saveStatus,
    updateField,
    init,
    saveSettings,
    saveOnboardingStatus,
  } = onboardingStore;
  const { isActive: isLicenseActive, initializeLicense } = useLicenseStore();

  const [currentStep, setCurrentStep] = useState(() => {
  const savedState = loadOnboardingFromLocalStorage();
    if (savedState && savedState.currentStep !== undefined) {
      // Ensure saved step is within bounds
      return Math.min(savedState.currentStep, STEPS.length - 1);
    }
    return 0;
  });

  const [hasInteracted, setHasInteracted] = useState(() => {
    const savedState = loadOnboardingFromLocalStorage();
    return savedState?.hasInteracted || {};
  });

  const [toast, setToast] = useState({ show: false, message: '' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Safety check: ensure step exists and handle out-of-bounds gracefully
  const step = STEPS[currentStep] || STEPS[STEPS.length - 1] || STEPS[0] || {};
  const CurrentStepComponent = step?.component;
  const transition = useTransitions({ type: 'slideUpFade' });

  // Simple reactive validation - directly in component
  const stepValid = React.useMemo(() => {
    switch (step?.id) {
      case 'channels': {
        // At least one channel must be enabled with a valid value WITHOUT errors
        // AND all channels with values must be valid (no invalid entries allowed)
        if (!platformsData) return false;

        let hasAtLeastOneValidChannel = false;
        let hasInvalidChannel = false;

        Object.entries(platformsData).forEach(([platformId, channel]) => {
          // If channel has a value (user started filling it)
          if (channel.value) {
            const trimmedValue = channel.value.trim();

            // Empty value after trim is invalid
            if (!trimmedValue) {
              hasInvalidChannel = true;
              return;
            }

            // Validate using shared validation function
            const isValid = validatePlatformValue(platformId, trimmedValue);

            if (isValid && channel.enabled) {
              hasAtLeastOneValidChannel = true;
            } else if (!isValid) {
              // If any platform with a value is invalid, mark as invalid
              hasInvalidChannel = true;
            }
          }
        });

        // Valid only if we have at least one valid channel AND no invalid channels
        return hasAtLeastOneValidChannel && !hasInvalidChannel;
      }
      case 'theme':
        return !!selectedTheme;
      case 'visibility':
        return true;
      case 'final':
        // For free version, always valid. For pro, need active license
        return !isPro || isLicenseActive;
      default:
        return true;
    }
  }, [step?.id, selectedTheme, isLicenseActive, platformsData]);

  const getStepValue = (step) => {
    if (!step?.fieldName) return null;

    // Access the store value dynamically by field name
    const value = onboardingStore[step.fieldName];

    // Return appropriate default values based on field type
    if (value === null || value === undefined) {
      switch (step.fieldName) {
        case 'agentPlatforms':
          return {
            whatsapp: { enabled: false, value: '' },
            instagram: { enabled: false, value: '' },
            telegram: { enabled: false, value: '' },
            messenger: { enabled: false, value: '' }
          };
        case 'selectedTheme':
          return null;
        case 'visibilitySettings':
          return {
            mode: 'include',
            exclude: { pages: [], categories: [], tags: [], postTypes: [] },
            include: { pages: [], categories: [], tags: [], postTypes: [] },
          };
        default:
          return null;
      }
    }

    return value;
  };

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        await initializeLicense();
        await init();

        const savedState = loadOnboardingFromLocalStorage();

        if (savedState) {
          // Restore form data
          if (savedState.formData) {
            Object.entries(savedState.formData).forEach(([fieldName, value]) => {
              if (value !== null && value !== undefined) {
                updateField(fieldName, value);
              }
            });
          }

          // Restore hasInteracted state
          if (savedState.hasInteracted) {
            setHasInteracted(savedState.hasInteracted);
          }
        }
      } catch (error) {
        console.error('Error during onboarding initialization:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeOnboarding();
  }, [init, updateField]);

  useDebouncedEffect(
    () => {
      if (!isInitialized) return;

      const formData = {
        agentPlatforms: platformsData,
        selectedTheme,
        visibilitySettings,
        newsletterEmail,
        newsletterSubscribed,
      };

      saveOnboardingToLocalStorage(currentStep, formData, hasInteracted);
    },
    [
      isInitialized,
      currentStep,
      platformsData,
      selectedTheme,
      visibilitySettings,
      newsletterEmail,
      newsletterSubscribed,
      hasInteracted,
    ],
    500,
  );

  useEffect(() => {
    if (!saveStatus) return;

    const messages = {
      success: __('Settings saved successfully', 'smashballoon-wpchat-livechat-customer-support'),
      error: __(
        'Failed to save settings. Please try again.',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    };

    setToast({
      show: true,
      message: messages[saveStatus] || '',
    });
  }, [saveStatus]);

  const handleExit = async () => {
    await saveOnboardingStatus();
    clearOnboardingFromLocalStorage();
    window.location.href = wpChatAdmin.mainPageUrl;
  };

  const handleSubmit = async () => {
    const success = await saveSettings();

    if (success) {
      clearOnboardingFromLocalStorage();
      setTimeout(() => {
        window.location.href = wpChatAdmin.mainPageUrl;
      }, 1000);
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={STEPS.length}
      onExit={handleExit}
      className='wpchat:w-full'
    >
      <div className='wpchat:w-full wpchat:max-w-[768px]'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={step.key || step.title}
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={transition.transition}
            className='wpchat:w-full'
          >
            <Step
              title={step.title}
              description={step.description}
              bodyClassName={step.bodyClassName}
              contentClassName={step.contentClassName}
              containerClassName={step.containerClassName}
              titleClassName={step.titleClassName}
            >
              <div className='wpchat:w-full'>
                {CurrentStepComponent && (
                  <CurrentStepComponent
                    value={getStepValue(step)}
                    onChange={
                      step.fieldName ? (value) => updateField(step.fieldName, value) : updateField
                    }
                    isValid={stepValid}
                    hasInteracted={hasInteracted}
                    onInteractionChange={setHasInteracted}
                  />
                )}
              </div>
            </Step>

            {/* Navigation aligned directly beneath the step card */}
            <div className='wpchat:flex wpchat:w-full wpchat:justify-end wpchat:pt-4'>
              <OnboardingNavigation
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                onSave={handleSubmit}
                isValid={stepValid}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <Toast
          show={toast.show}
          message={toast.message}
          onClose={() => setToast({ show: false, message: '' })}
        />
      </div>
    </OnboardingLayout>
  );
};

export default Onboarding;
