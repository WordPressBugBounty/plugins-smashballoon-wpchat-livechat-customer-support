import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { TextField } from '@AC/ui/TextField';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';
import { getImagePath } from '@Utils/getImagePath';
import { isValidEmail } from '@Utils/validation';
import { shouldShowVerificationState } from '@Utils/newsletterUtils';
import { useRTL, rtlX } from '@Hooks/useRTL';

/**
 * StepOne Component
 *
 * The first step in the FAQ onboarding flow.
 * Displays an introductory image and message to help users understand
 * the value of instant answers using FAQs.
 *
 * @component
 * @returns {JSX.Element} Rendered StepOne component
 */
function StepOne() {
  return (
    <div className='wpchat:flex wpchat:flex-wrap wpchat:justify-center wpchat:pb-7 wpchat:pt-8'>
      <img
        src={`${getImagePath('faq-step-1.png')}`}
        alt='faq-step-1'
        className='wpchat:mb-9 wpchat:w-full wpchat:max-w-[450px]'
      />
      <TitleDescription
        title={__(
          'Answer your users most common questions instantly',
          'smashballoon-wpchat-livechat-customer-support',
        )}
        description={__(
          'Turn repeat questions into instant answers, right inside your chat.',
          'smashballoon-wpchat-livechat-customer-support',
        )}
        titleClassName='wpchat:text-lg wpchat:mb-3.5'
        descriptionClassName='wpchat:text-sm wpchat:text-gray-800 wpchat:max-w-[250px]'
        className='wpchat:mb-0 wpchat:max-w-[270px] wpchat:text-center'
      />
    </div>
  );
}

/**
 * StepTwo Component
 *
 * The second step in the FAQ onboarding flow.
 * Highlights the benefits of AI-powered search to improve user experience.
 *
 * @component
 * @returns {JSX.Element} Rendered StepTwo component
 */
function StepTwo() {
  return (
    <div className='wpchat:flex wpchat:flex-wrap wpchat:justify-center wpchat:pb-7 wpchat:pt-8'>
      <img
        src={`${getImagePath('faq-step-2.png')}`}
        alt='faq-step-1'
        className='wpchat:mb-10.5 wpchat:w-full wpchat:max-w-[450px]'
      />
      <TitleDescription
        title={__('Smart AI search, less dead ends', 'smashballoon-wpchat-livechat-customer-support')}
        description={__(
          'With smart search, AI automatically lets your users find the relevant answer without them typing a specific keyword.',
          'smashballoon-wpchat-livechat-customer-support',
        )}
        titleClassName='wpchat:text-lg wpchat:mb-3.5'
        descriptionClassName='wpchat:text-sm wpchat:text-gray-800'
        className='wpchat:mb-0 wpchat:max-w-[260px] wpchat:text-center'
      />
    </div>
  );
}

/**
 * StepThree Component
 *
 * The third step in the FAQ onboarding flow.
 * Prompts the user to enter an email address to receive Smart Search tokens.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.email - Current email input value
 * @param {function} props.onEmailChange - Handler for email input changes
 * @param {boolean} props.showEmailError - Whether to show email validation error
 * @returns {JSX.Element} Rendered StepThree component
 */

function StepThree({ email, onEmailChange, showEmailError, newsletterStatus, settings }) {
  const emailIsInvalid = !email.trim() || !isValidEmail(email);
  const hasEmailError = showEmailError && emailIsInvalid;

  // Get configurable token amount for claim offer
  const claimOfferTokenAmount = settings?.claimOfferTokenAmount || 5000;

  // Check if user has claimed offer within 24 hours
  const showVerificationMessage = shouldShowVerificationState(newsletterStatus);

  if (showVerificationMessage) {
    // Show verification message if user already claimed within 24 hours
    return (
      <div className='wpchat:mx-auto wpchat:flex wpchat:max-w-[330px] wpchat:flex-wrap wpchat:justify-center wpchat:pb-13.5'>
        <SvgLoader name='emailAlt2' className='wpchat:mt-6 wpchat:mb-5 wpchat:w-full' />
        <TitleDescription
          title={__('Check your inbox!', 'smashballoon-wpchat-livechat-customer-support')}
          description={__(
            `Please check ${newsletterStatus.email} to confirm your subscription and claim your ${claimOfferTokenAmount.toLocaleString()} tokens.`,
            'smashballoon-wpchat-livechat-customer-support',
          )}
          titleClassName='wpchat:text-lg wpchat:mb-3 wpchat:text-green-900'
          descriptionClassName='wpchat:text-sm wpchat:text-green-900'
          className='wpchat:mb-0 wpchat:max-w-[280px] wpchat:text-center'
        />
      </div>
    );
  }

  // Show normal email input form
  return (
    <div className='wpchat:mx-auto wpchat:flex wpchat:max-w-[330px] wpchat:flex-wrap wpchat:justify-center wpchat:pb-13.5'>
      <SvgLoader name='aiSearchAlt' className='wpchat:mt-6 wpchat:mb-5 wpchat:w-full' />
      <TitleDescription
        title={__(
          `Get ${claimOfferTokenAmount.toLocaleString()} tokens to try Smart Search!`,
          'smashballoon-wpchat-livechat-customer-support',
        )}
        description={__(
          'Tokens are used whenever you run a Smart Search or add an FAQ. Drop your email below and we will credit your account.',
          'smashballoon-wpchat-livechat-customer-support',
        )}
        titleClassName='wpchat:text-lg wpchat:mb-3 wpchat:mb-2.5 wpchat:max-w-[240px]'
        descriptionClassName='wpchat:text-sm wpchat:text-gray-800'
        className='wpchat:mb-10 wpchat:max-w-[280px] wpchat:text-center'
      />
      <TextField
        placeholder={__('Your email address', 'smashballoon-wpchat-livechat-customer-support')}
        name='email'
        type='email'
        value={email}
        onChange={onEmailChange}
        isInvalid={hasEmailError}
        errorMessage={hasEmailError ? __('Please enter a valid email address', 'smashballoon-wpchat-livechat-customer-support') : ''}
        inputClassName='wpchat:w-full wpchat:py-3 wpchat:text-base'
        as='input'
        isRequired
      />
    </div>
  );
}

/**
 * StepFour Component
 *
 * The final step in the FAQ onboarding flow.
 * Informs the user to check their inbox for a confirmation and token claim.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.email - Email address used for the subscription
 * @returns {JSX.Element} Rendered StepFour component
 */

function StepFour({ email, settings }) {
  // Get configurable token amount for claim offer
  const claimOfferTokenAmount = settings?.claimOfferTokenAmount || 5000;

  return (
    <div className="wpchat:flex wpchat:flex-col wpchat:items-center wpchat:text-center">
      <SvgLoader name="emailAlt" className="wpchat:mb-7" />
      <TitleDescription
        title={__('Check your inbox!', 'smashballoon-wpchat-livechat-customer-support')}
        description={__(
          `Please check ${email} to confirm your subscription and claim your ${claimOfferTokenAmount.toLocaleString()} tokens.`,
          'smashballoon-wpchat-livechat-customer-support',
        )}
        titleClassName="wpchat:text-lg wpchat:mb-1.5"
        descriptionClassName="wpchat:text-sm wpchat:text-gray-800"
        className="wpchat:text-center wpchat:max-w-[245px]"
      />
    </div>
  );
}

/**
 * PaginationDots Component
 *
 * Renders progress dots for the onboarding flow.
 * Highlights the current step among the visible steps.
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.currentStep - Current active onboarding step (0-3)
 * @param {boolean} props.hasAccessToken - Whether the user has an access token
 * @returns {JSX.Element} Rendered PaginationDots component
 */

function PaginationDots({ currentStep, hasAccessToken }) {
  // If user has access token, only show 2 dots (steps 0 and 1)
  const totalDots = hasAccessToken ? 2 : 3;
  const effectiveStep = hasAccessToken ? currentStep : (currentStep >= 2 ? 2 : currentStep);

  return (
    <div className='wpchat:flex wpchat:justify-center wpchat:gap-3 wpchat:px-3.5 wpchat:pb-3'>
      {Array.from({ length: totalDots }, (_, index) => (
        <span
          key={index}
          className={`wpchat:h-2.5 wpchat:w-2.5 wpchat:rounded-full wpchat:transition-colors ${
            index === effectiveStep ? 'wpchat:bg-wp-light-blue-500' : 'wpchat:bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * FaqWelcomeSteps Component
 *
 * Manages and renders the full onboarding step flow for the FAQ feature.
 * Handles animated transitions between steps and displays corresponding content.
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.currentStep - Current onboarding step (0–3)
 * @param {string} props.email - Current email input value
 * @param {function} props.onEmailChange - Handler for email input changes
 * @param {boolean} props.showEmailError - Whether to show email validation error
 * @param {boolean} props.hasAccessToken - Whether the user has an access token
 * @returns {JSX.Element} Rendered onboarding step component with transitions
 */

export default function FaqWelcomeSteps({ currentStep, email, onEmailChange, showEmailError, hasAccessToken, newsletterStatus, settings }) {
  const [height, setHeight] = useState('auto');
  const containerRef = useRef(null);
  const isRTL = useRTL();

  // Conditionally include steps based on hasAccessToken
  const steps = hasAccessToken
    ? [
        <StepOne key='step1' />,
        <StepTwo key='step2' />,
      ]
    : [
        <StepOne key='step1' />,
        <StepTwo key='step2' />,
        <StepThree key='step3' email={email} onEmailChange={onEmailChange} showEmailError={showEmailError} newsletterStatus={newsletterStatus} settings={settings} />,
        <StepFour key='step4' email={email} settings={settings} />,
      ];


  return (
    <div className='relative'>
      <PaginationDots currentStep={currentStep} hasAccessToken={hasAccessToken} />

      {/* Animate height wrapper */}
      <motion.div
        transition={{ duration: 0.3 }}
        className={`wpchat:overflow-hidden wpchat:min-h-[350px] ${currentStep === 3 ? 'wpchat:flex wpchat:items-center wpchat:justify-center' : ''}`}
      >
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: rtlX(10, isRTL) }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: rtlX(-10, isRTL) }}
            transition={{ duration: 0.25 }}
          >
            <div ref={containerRef}>{steps[currentStep]}</div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
