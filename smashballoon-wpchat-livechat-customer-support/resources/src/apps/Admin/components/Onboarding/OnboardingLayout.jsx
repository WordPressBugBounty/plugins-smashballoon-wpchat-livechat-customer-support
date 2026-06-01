import React from 'react';
import { twMerge } from 'tailwind-merge';
import OnboardingHeader from './OnboardingHeader';

/**
 * Full-screen onboarding layout component that provides a distraction-free experience
 * 
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The main content to be rendered
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {number} props.totalSteps - Total number of steps
 * @param {Function} props.onExit - Callback when exit button is clicked
 *
 * @param {string} props.className - Additional CSS classes for the content area
 * @returns {JSX.Element} The rendered full-screen onboarding layout
 */
const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  onExit,
  className = '',
}) => {
  return (
    <div className='wpchat:fixed wpchat:inset-0 wpchat:z-[99999] wpchat:bg-gray-100 wpchat:overflow-y-auto'>
      {/* Full-screen container */}
      <div className='wpchat:flex wpchat:h-full wpchat:flex-col'>
        {/* Header */}
        <OnboardingHeader
          currentStep={currentStep}
          totalSteps={totalSteps}
          onExit={onExit}
        />
        
        {/* Main content area */}
        <main className='wpchat:flex-1 wpchat:overflow-visible wpchat:relative'>
          <div
            className={twMerge(
              'wpchat:container wpchat:mx-auto wpchat:px-4 wpchat:py-6 wpchat:max-w-4xl wpchat:min-h-full wpchat:flex wpchat:flex-col wpchat:items-center wpchat:justify-start wpchat:bg-gray-100',
              className
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OnboardingLayout;
