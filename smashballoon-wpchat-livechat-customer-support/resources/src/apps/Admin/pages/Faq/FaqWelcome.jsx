import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import DefaultModal from '@AC/DefaultModal';
import FaqToken from '@AC/Faq/FaqToken';
import PageLayout from '@AC/PageLayout';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import SvgLoader from '@Components/SvgLoader';
import useFaqsStore from '@DataStore/faqs/faqsStore';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { getImagePath } from '@Utils/getImagePath';
import { isPro } from '@Utils/isPro';
import { isValidEmail } from '@Utils/validation';
import { wpChatAPI } from '@Utils/apiHelper';
import { shouldShowVerificationState } from '@Utils/newsletterUtils';
import FaqWelcomeSteps from './FaqWelcomeSteps';
import { cn } from '@Utils/cn';

/**
 * FaqWelcome component displays an introductory message or UI
 * for the FAQ section. Typically shown when no specific FAQ is selected.
 *
 * @component
 * @returns {JSX.Element} The rendered FaqWelcome component.
 */
export default function FaqWelcome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showEmailError, setShowEmailError] = useState(false);
  const [isClaimingOffer, setIsClaimingOffer] = useState(false);
  const { checkFaqOnboardingStatus, dismissFaqOnboarding } = useFaqsStore();
  const { settings, fetchSettings } = useSettingsStore();

  const FAQInfo = [
    {
      icon: 'frameInspect',
      title: __('Add your most common questions', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Get asked the same questions all the time? Add them to FAQs right within the chatbot.',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      icon: 'quiz',
      title: __('Add up to 10 questions', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'In the free version, you can add up to 10 questions. Add more by upgrading to Pro.',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      icon: 'barChart',
      title: __('Get analytics', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Get detailed analytics about which questions your users click the most',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
  ];

  useEffect(() => {
    const initializeOnboarding = async () => {
      // Fetch settings if not already loaded
      if (!settings) {
        await fetchSettings();
      }

      const isDismissed = await checkFaqOnboardingStatus();

      if (!isDismissed) {
        setIsOpen(true);
      }
    };

    initializeOnboarding();
  }, [checkFaqOnboardingStatus, fetchSettings, settings]);

  const handleDismissOnboarding = async () => {
    await dismissFaqOnboarding();
    setIsOpen(false);
  };

  const emailIsInvalid = !email.trim() || !isValidEmail(email);
  const hasAccessToken = settings?.hasAccessToken || false;

  const onEmailChange = (newEmail) => {
    setEmail(newEmail);
    if (showEmailError) setShowEmailError(false);
  };

  const handleNext = async () => {
    // Determine max steps based on conditions:
    // - Pro users: only 2 steps (0 and 1)
    // - Free users with access token: 2 steps (0 and 1), skip token claim steps
    // - Free users without access token: all 4 steps (0-3)
    const maxStep = (isPro || hasAccessToken) ? 1 : 3;

    // Validate email on step 2 before proceeding (only for free users without token)
    if (currentStep === 2 && !isPro && !hasAccessToken) {
      if (emailIsInvalid) {
        setShowEmailError(true);
        return; // Don't proceed if email is invalid
      }

      // Claim offer before proceeding to next step
      setIsClaimingOffer(true);
      try {
        await wpChatAPI.post('smart-search/claim-offer', { email });

        // Refresh settings to update newsletter status
        await fetchSettings();
      } catch (error) {
        console.error('Failed to claim offer:', error);
        // Continue anyway - don't block the user
      } finally {
        setIsClaimingOffer(false);
      }
    }

    if (currentStep < maxStep) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismissOnboarding();
    }
  };

  const handleExit = () => {
    handleDismissOnboarding();
  };

  const renderButtons = () => {
    if (currentStep === 0) {
      return (
        <div className='wpchat:flex wpchat:w-full wpchat:justify-end wpchat:gap-2'>
          <Button variant='ghost' onPress={handleExit}>
            {__('Skip onboarding', 'smashballoon-wpchat-livechat-customer-support')}
          </Button>
          <Button variant='primary' onPress={handleNext}>
            {__('Next', 'smashballoon-wpchat-livechat-customer-support')}
            <SvgLoader name='chevronRight' className='wpchat:rtl:rotate-180' />
          </Button>
        </div>
      );
    }

    if (currentStep === 1) {
      // Check if this is the last step for the user
      const isLastStep = isPro || hasAccessToken;

      return (
        <div className='wpchat:flex wpchat:w-full wpchat:justify-end wpchat:gap-2'>
          {!isLastStep && (
            <Button variant='ghost' onPress={handleExit}>
              {__('Skip onboarding', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
          )}
          <Button variant='primary' onPress={handleNext}>
            {isLastStep
              ? __('Get Started', 'smashballoon-wpchat-livechat-customer-support')
              : __('Next', 'smashballoon-wpchat-livechat-customer-support')}
            {!isLastStep && <SvgLoader name='chevronRight' className='wpchat:rtl:rotate-180' />}
          </Button>
        </div>
      );
    }

    if (currentStep === 2 && !isPro && !hasAccessToken) {
      // Check if user is in verification state (already claimed within 24 hours)
      const newsletterStatus = settings?.newsletterStatus || { subscribed: false, subscription_date: '', email: '' };
      const showVerificationState = shouldShowVerificationState(newsletterStatus);

      if (showVerificationState) {
        // Show "Get Started" button if user already claimed and is in verification state
        return (
          <div className='wpchat:flex wpchat:w-full wpchat:justify-end wpchat:gap-2'>
            <Button variant='primary' onPress={handleDismissOnboarding}>
              {__('Get Started', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
          </div>
        );
      }

      // Show normal claim deal buttons if user hasn't claimed yet
      return (
        <div className='wpchat:flex wpchat:w-full wpchat:justify-end wpchat:gap-2'>
          <Button variant='ghost' onPress={handleExit}>
            {__('No thanks!', 'smashballoon-wpchat-livechat-customer-support')}
          </Button>
          <Button
            variant='tertiary'
            onPress={handleNext}
            isDisabled={isClaimingOffer}
          >
            {isClaimingOffer ? (
              <>
                <SvgLoader name='spinner' className='wpchat:animate-spin' />
                {__('Claiming...', 'smashballoon-wpchat-livechat-customer-support')}
              </>
            ) : (
              <>
                <SvgLoader name='check' />
                {__('Claim Deal', 'smashballoon-wpchat-livechat-customer-support')}
              </>
            )}
          </Button>
        </div>
      );
    }

    if (currentStep === 3 && !isPro && !hasAccessToken) {
      return (
        <Button onPress={handleExit} variant='primary'>
          <SvgLoader name='check' />
          {__('Sounds good!', 'smashballoon-wpchat-livechat-customer-support')}
        </Button>
      );
    }

    return null;
  };

  return (
    <PageLayout
      breadcrumb={[{ label: __('Frequent Question', 'smashballoon-wpchat-livechat-customer-support') }]}
      className='wpchat:max-w-full wpchat:px-4 wpchat:md:px-13 wpchat:md:pt-13'
    >
      <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-x-2 wpchat:lg:gap-x-28 wpchat:xl:grid-cols-[1fr_315px]'>
        <div>
          <div className='wpchat:gap-x- wpchat:grid wpchat:grid-cols-1 wpchat:items-start wpchat:md:grid-cols-[348px_1fr]'>
            <img
              src={`${getImagePath('faq-welcome.png')}`}
              alt='faq'
              className='wpchat:w-full wpchat:max-w-full'
            />
            <div className='wpchat:mb-7 wpchat:w-full wpchat:pt-7 wpchat:md:ms-14 wpchat:md:max-w-[295px]'>
              <h3 className='wpchat:mt-0 wpchat:mb-1 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
                {__(
                  'Quickly answer your frequent questions in the chatbot',
                  'smashballoon-wpchat-livechat-customer-support',
                )}
              </h3>
              <p className='wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-500'>
                {__(
                  'Add your most asked questions, and their answers, right into the chatbot and answer them quickly.',
                  'smashballoon-wpchat-livechat-customer-support',
                )}
              </p>
              <Button
                className='wpchat:mt-8'
                variant='primary'
                onPress={() => navigate('/faqs/create')}
              >
                <SvgLoader name='plus' className='wpchat:h-[1.3em] wpchat:w-[1.3em]' />
                {__('Add Question', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
            </div>
          </div>
          {FAQInfo && (
            <div className='wpchat:gap-3 wpchat:md:gap-2 wpchat:max-[745px]:'>
              {FAQInfo.map(({ icon, title, description }, index) => (
                <div
                  key={index}
                  className={cn(
                    'wpchat:flex wpchat:flex-wrap wpchat:items-center wpchat:gap-x-5 wpchat:md:py-5',
                    {
                      'wpchat:border-b wpchat:border-gray-200': index !== FAQInfo.length - 1,
                    }
                  )}
                >
                  <div className='wpchat:relative wpchat:mb-5 wpchat:h-10 wpchat:w-10 wpchat:rounded-full wpchat:shadow-md wpchat:bg-white'>
                    <SvgLoader
                      name={icon}
                      className='wpchat:absolute wpchat:top-2.5 wpchat:end-2.5 wpchat:h-[1.6em] wpchat:w-[1.6em] wpchat:fill-gray-900'
                    />
                  </div>
                  <div>
                    <h5 className='wpchat:mt-0 wpchat:mb-0.5 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
                      {title}
                    </h5>
                    <p className='wpchat:mt-0 wpchat:text-[13px] wpchat:leading-relaxed wpchat:text-gray-800'>
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Section */}
        <div className='wpchat:static wpchat:md:sticky wpchat:md:top-24'>
          <FaqToken />
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} isKeyboardDismissDisabled>
        <Dialog>
          <DefaultModal
            setIsOpen={setIsOpen}
            disableCancelButton={true}
            hideHeader={true}
            button={renderButtons()}
            bodyClassName='wpchat:pt-8 wpchat:px-5 wpchat:pb-0'
          >
            <FaqWelcomeSteps currentStep={currentStep} email={email} onEmailChange={onEmailChange} showEmailError={showEmailError} hasAccessToken={hasAccessToken} newsletterStatus={settings?.newsletterStatus} settings={settings} />
          </DefaultModal>
        </Dialog>
      </Modal>
    </PageLayout>
  );
}
