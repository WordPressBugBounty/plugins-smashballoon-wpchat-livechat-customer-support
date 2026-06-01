import React, { Fragment, memo, useMemo } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Steps indicator component showing progress through onboarding
 * 
 * @param {Object} props - The component props
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {number} props.totalSteps - Total number of steps
 * @returns {JSX.Element} The rendered steps indicator
 */
const CheckIcon = memo(function CheckIcon() {
  return (
    <svg width='10' height='8' viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M8.83301 1.5L3.67676 7L1.33301 4.5' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
});

const Dot = memo(function Dot({ status }) {
  if (status === 'completed') {
    return (
      <div className='wpchat:flex wpchat:h-4 wpchat:w-4 wpchat:items-center wpchat:justify-center wpchat:rounded-full wpchat:bg-gray-800'>
        <CheckIcon />
      </div>
    );
  }

  if (status === 'current') {
    return <div className='wpchat:h-4 wpchat:w-4 wpchat:rounded-full wpchat:bg-white wpchat:border-[4px] wpchat:border-wp-light-blue-500' />;
  }

  return <div className='wpchat:h-4 wpchat:w-4 wpchat:rounded-full wpchat:bg-gray-50 wpchat:border-[4px] wpchat:border-gray-300' />;
});

const Connector = memo(function Connector() {
  return <div className='wpchat:h-[2px] wpchat:w-10 wpchat:mx-1.5 wpchat:rounded-full wpchat:bg-gray-300' aria-hidden />;
});

const OnboardingStepsIndicator = ({ currentStep, totalSteps }) => {
  const steps = useMemo(() => Array.from({ length: totalSteps }, (_, index) => index), [totalSteps]);

  const statuses = useMemo(
    () => steps.map((index) => (index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending')),
    [steps, currentStep]
  );

  return (
    <div className='wpchat:flex wpchat:items-center'>
      {statuses.map((status, index) => (
        <Fragment key={index}>
          {index > 0 && <Connector />}
          <div
            className='wpchat:relative wpchat:flex wpchat:items-center wpchat:justify-center'
            aria-label={
              status === 'completed'
                ? __('Completed step', 'smashballoon-wpchat-livechat-customer-support')
                : status === 'current'
                ? __('Current step', 'smashballoon-wpchat-livechat-customer-support')
                : __('Pending step', 'smashballoon-wpchat-livechat-customer-support')
            }
          >
            <Dot status={status} />
          </div>
        </Fragment>
      ))}
    </div>
  );
};

export default OnboardingStepsIndicator;
