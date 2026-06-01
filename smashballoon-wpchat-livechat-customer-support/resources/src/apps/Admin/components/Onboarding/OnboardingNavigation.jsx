import SvgLoader from '@Components/SvgLoader';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import { isPro } from '@Utils/isPro';
import { isFirstStep, isLastStep } from '../../config/onboardingSteps';

const OnboardingNavigation = ({ currentStep, setCurrentStep, onSave, isValid }) => {
  const navigate = useNavigate();
  
  const handleNext = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, [setCurrentStep]);

  const handleBack = useCallback(() => {
    isFirstStep(currentStep) ? navigate('/') : setCurrentStep((prev) => prev - 1);
  }, [setCurrentStep, currentStep]);

  const handlePublish = useCallback(() => {
    onSave();
  }, [onSave]);

  // Determine final button text and variant based on plan
  const getFinalButtonConfig = () => {
    if (!isPro) {
      return {
        variant: 'secondary',
        text: __('Complete Setup Without Upgrading', 'smashballoon-wpchat-livechat-customer-support')
      };
    }
    
    return {
      variant: 'primary',
      text: isValid
      ? __('Complete Setup', 'smashballoon-wpchat-livechat-customer-support')
      : __('Activate and Complete Setup', 'smashballoon-wpchat-livechat-customer-support')
    };
  };

  return (
    <div className='wpchat:flex wpchat:gap-2'>
      {isLastStep(currentStep) ? (
        (() => {
          const buttonConfig = getFinalButtonConfig();
          return (
            <Button 
              onPress={handlePublish} 
              variant={buttonConfig.variant} 
              isDisabled={!isValid}
              className='wpchat:justify-center wpchat:h-[48px] wpchat:px-4 wpchat:border-0 wpchat:text-base'
            >
              {buttonConfig.text}
              <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
            </Button>
          );
        })()
      ) : (
        <>
         {!isFirstStep(currentStep) && (
            <Button onPress={handleBack} variant='secondary' className='wpchat:h-[48px] wpchat:px-4 wpchat:border-0 wpchat:text-base'>
              <SvgLoader name='chevronLeft' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
              {__('Back', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
          )}
          <Button onPress={handleNext} variant='primary' isDisabled={!isValid} className='wpchat:h-[48px] wpchat:px-4 wpchat:border-0 wpchat:text-base'>
            {__('Next', 'smashballoon-wpchat-livechat-customer-support')}
            <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
          </Button>
        </>
      )}
    </div>
  );
};

export default OnboardingNavigation;
