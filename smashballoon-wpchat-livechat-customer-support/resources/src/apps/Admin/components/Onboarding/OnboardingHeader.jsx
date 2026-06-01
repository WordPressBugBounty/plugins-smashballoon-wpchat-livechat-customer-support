import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import OnboardingStepsIndicator from './OnboardingStepsIndicator';

/**
 * Header component for the full-screen onboarding experience
 * 
 * @param {Object} props - The component props
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {number} props.totalSteps - Total number of steps
 * @param {Function} props.onExit - Callback when exit button is clicked
 * @returns {JSX.Element} The rendered onboarding header
 */
const OnboardingHeader = ({
  currentStep,
  totalSteps,
  onExit,
}) => {
  return (
    <header className='wpchat:bg-gray-100'>
      {/* Top bar: Exit button flush to the very top-right */}
      <div className='wpchat:fixed wpchat:top-0 wpchat:md:end-[5%] wpchat:end-4 wpchat:z-50'>
        <Button
          variant='ghost'
          onPress={onExit}
          className='wpchat:bg-gray-700 wpchat:text-white wpchat:text-base wpchat:rounded-t-none'
          aria-label={__('Exit Setup', 'smashballoon-wpchat-livechat-customer-support')}
        >
          <SvgLoader name='closeCircle' className='wpchat:w-5 wpchat:h-5 wpchat:fill-gray-700' />
          <span className='wpchat:hidden wpchat:md:inline'>
            {__('Exit Setup', 'smashballoon-wpchat-livechat-customer-support')}
          </span>
        </Button>
      </div>

      {/* Branding + steps beneath */}
      <div className='wpchat:py-4 wpchat:pt-12.5'>
        <div className='wpchat:flex wpchat:items-center wpchat:justify-between wpchat:max-w-7xl wpchat:mx-auto'>
          {/* Left side - Empty space for balance */}
          <div className='wpchat:flex wpchat:w-1/3'></div>

          {/* Center - Logo, Brand and Steps Indicator */}
          <div className='wpchat:flex wpchat:flex-col wpchat:items-center wpchat:gap-9 wpchat:w-1/3'>
            <SvgLoader name='logoBySmashBalloon' />
            <OnboardingStepsIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>

          {/* Right side - spacer to keep center aligned */}
          <div className='wpchat:flex wpchat:w-1/3'></div>
        </div>
      </div>
    </header>
  );
};

export default OnboardingHeader;
