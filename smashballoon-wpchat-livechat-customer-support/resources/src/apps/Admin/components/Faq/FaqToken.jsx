import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import CalloutCard from '@AC/CalloutCard';
import CardWithLine from '@AC/CardWithLine';
import DefaultModal from '@AC/DefaultModal';
import Separator from '@AC/Separator';
import TextImage from '@AC/TextImage';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { LinkButton } from '@AC/ui/LinkButton';
import { Modal } from '@AC/ui/Modal';
import { ProgressBar } from '@AC/ui/ProgressBar';
import { TextField } from '@AC/ui/TextField';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';
import useFaqsStore from '@DataStore/faqs/faqsStore';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { wpChatAPI } from '@Utils/apiHelper';
import { shouldShowVerificationState } from '@Utils/newsletterUtils';
import { isValidEmail } from '@Utils/validation';

/**
 * FaqToken Component
 *
 * A React component intended to display a token or label related to an FAQ item.
 * This might include tags like "New", "Updated", or category indicators.
 *
 * @component
 * @example
 * return (
 *   <FaqToken />
 * );
 *
 * @returns {JSX.Element} The rendered FaqToken component.
 */
function FaqToken() {
  const [claimEmail, setClaimEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [isClaimingOffer, setIsClaimingOffer] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const { dismissFaqOnboarding } = useFaqsStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { isPro: isProPlan } = useEntitlements();

  useEffect(() => {
    // Fetch settings if not already loaded
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  // Check if user has access token
  const hasAccessToken = settings?.hasAccessToken || false;

  // Get token usage data
  const tokenUsage = settings?.tokenUsage || { token_limit: 0, used_tokens: 0 };
  const remainingTokens = Math.max(0, tokenUsage.token_limit - tokenUsage.used_tokens);
  const progressPercentage =
    tokenUsage.token_limit > 0 ? Math.round((remainingTokens / tokenUsage.token_limit) * 100) : 0;

  // Get smart search enabled status from settings
  // Smart search is only enabled if user has access token AND the setting is enabled
  const isSmartSearchEnabled = hasAccessToken && settings?.smartSearchEnabled !== false;

  // Get newsletter status and check 24-hour logic
  const newsletterStatus = settings?.newsletterStatus || {
    subscribed: false,
    subscription_date: '',
    email: '',
  };
  const showVerificationState = shouldShowVerificationState(newsletterStatus);

  // Get configurable token amount for claim offer
  const claimOfferTokenAmount = settings?.claimOfferTokenAmount || 5000;

  const toggleSearch = async () => {
    const newState = !isSmartSearchEnabled;

    // Update the setting on the server
    const { saveSettings } = useSettingsStore.getState();
    await saveSettings({
      ...settings,
      smartSearchEnabled: newState,
    });
  };

  const emailIsInvalid = !claimEmail.trim() || !isValidEmail(claimEmail);
  const hasEmailError = showEmailError && emailIsInvalid;

  const onEmailChange = (email) => {
    setClaimEmail(email);
    if (showEmailError) setShowEmailError(false);
  };

  const handleClaimDeal = async () => {
    if (emailIsInvalid) {
      setShowEmailError(true);
      return;
    }

    setIsClaimingOffer(true);

    try {
      await wpChatAPI.post('smart-search/claim-offer', { email: claimEmail });

      // Refresh settings to update newsletter status
      await fetchSettings();
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to claim offer:', error);
      // Show error message to user
      setShowEmailError(true);
    } finally {
      setIsClaimingOffer(false);
    }
  };

  const handleSoundsGood = () => {
    dismissFaqOnboarding();
    setIsOpen(false);
  };

  const handleUpgradeClick = () => {
    setIsUpgradeOpen(true);
  };

  // Get upgrade dialog data for Smart Search tokens
  const tokensUpgradeDialogData = getUpgradeDialogData('smartSearchTokens', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.smartSearchTokens,
  });

  const enabledIcon = isSmartSearchEnabled ? 'aiSearchAlt' : 'aiSearch';
  const buttonLabel = isSmartSearchEnabled
    ? __('Disable', 'smashballoon-wpchat-livechat-customer-support')
    : __('Enable', 'smashballoon-wpchat-livechat-customer-support');
  const title = isSmartSearchEnabled
    ? __('AI Smart search is enabled', 'smashballoon-wpchat-livechat-customer-support')
    : __('AI Smart search is disabled', 'smashballoon-wpchat-livechat-customer-support');

  return (
    <>
      {/* Smart Search Card */}
      <div
        className='wpchat:mb-3 wpchat:rounded-sm wpchat:shadow-md'
        style={{
          background: `var(${isSmartSearchEnabled ? '--wpchat-color-admin-gradient-2' : '--wpchat-color-admin-gradient-1'})`,
        }}
      >
        <div className='wpchat:relative wpchat:px-5 wpchat:pt-7 wpchat:pb-5'>
          <SvgLoader name={enabledIcon} className='wpchat:mb-5' />

          {hasAccessToken && (
            <div className='wpchat:absolute wpchat:top-2 wpchat:end-2 wpchat:flex wpchat:gap-2'>
              <Button
                variant={isSmartSearchEnabled ? 'secondary' : 'primary'}
                onClick={toggleSearch}
              >
                {buttonLabel}
              </Button>
            </div>
          )}

          <TitleDescription
            title={title}
            className={isSmartSearchEnabled ? 'wpchat:mb-9' : 'wpchat:mb-0'}
            titleClassName='wpchat:mb-2'
            description={__(
              'With smart search, AI automatically lets your users find the relevant answer without them typing a specific keyword.',
              'smashballoon-wpchat-livechat-customer-support',
            )}
          />

          {isSmartSearchEnabled && (
            <>
              <ProgressBar
                value={progressPercentage}
                max={100}
                showValueLabel
                className='wpchat:mb-3 wpchat:w-full'
              />

              <div className='wpchat:mt-0 wpchat:flex wpchat:max-w-[465px] wpchat:gap-2 wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-500'>
                <span className='wpchat:font-bold wpchat:text-gray-900'>
                  {remainingTokens.toLocaleString()}
                </span>
                {__('Tokens remaining', 'smashballoon-wpchat-livechat-customer-support')}
              </div>
            </>
          )}
        </div>

        {isSmartSearchEnabled && (
          <button
            className='wpchat:text-wp-blue-500 wpchat:flex wpchat:w-full wpchat:cursor-pointer wpchat:justify-center wpchat:gap-1.5 wpchat:rounded-ee-sm wpchat:rounded-es-sm wpchat:bg-gray-50 wpchat:p-2 wpchat:text-sm wpchat:font-semibold'
            onClick={() => setIsOpen(true)}
          >
            <SvgLoader name='questionMarkCircleSolid' className='wpchat:fill-wp-blue-500' />
            {__('When are tokens used?', 'smashballoon-wpchat-livechat-customer-support')}
          </button>
        )}
      </div>

      {/* Token Explanation Modal */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Dialog>
          <DefaultModal
            title={__('When are tokens used', 'smashballoon-wpchat-livechat-customer-support')}
            setIsOpen={setIsOpen}
            disableCancelButton
            bodyClassName='wpchat:px-8 wpchat:pt-6 wpchat:pb-8'
            button={
              <Button onPress={handleSoundsGood} variant='primary'>
                <SvgLoader name='check' />
                {__('Sounds good!', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
            }
          >
            <TextImage
              number='1'
              title={__('Each time user makes a search', 'smashballoon-wpchat-livechat-customer-support')}
              description={__(
                'Each time your customer makes a search, we use AI to find the correct answer. Each search roughly consumes 50 tokens. ',
                'smashballoon-wpchat-livechat-customer-support',
              )}
              imageName='faq-token-search.png'
              altText={__('WhatsApp', 'smashballoon-wpchat-livechat-customer-support')}
              className='wpchat:mb-0'
              stackedLayout
            />
            <Separator style='dashed' className='wpchat:my-8' />
            <TextImage
              number='2'
              title={__(
                'Each time you add or edit an FAQ',
                'smashballoon-wpchat-livechat-customer-support',
              )}
              description={__(
                'To add a question to AI smart search consumes token as well. Editing a question consumes the same amount as when adding it new. ',
                'smashballoon-wpchat-livechat-customer-support',
              )}
              imageName='faq-token-question.png'
              altText={__('WhatsApp', 'smashballoon-wpchat-livechat-customer-support')}
              stackedLayout
              className='wpchat:mb-10'
            />

            <CalloutCard
              iconName='informationCircleItalic'
              title={__('What if I run out of tokens?', 'smashballoon-wpchat-livechat-customer-support')}
              description={__(
                'If you run out of Smart search tokens, the FAQs will still be visible along with the search. The search will revert to just matching for keywords.',
                'smashballoon-wpchat-livechat-customer-support',
              )}
            />
          </DefaultModal>
        </Dialog>
      </Modal>

      {/* Smart Search Tokens Upgrade Modal */}
      <Modal isOpen={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...tokensUpgradeDialogData} />
        </Dialog>
      </Modal>

      {/* Claim Deal Card - Only show if no access token exists */}
      {!hasAccessToken && (
        <CardWithLine className='wpchat:px-4 wpchat:pt-5 wpchat:pb-6'>
          {showVerificationState ? (
            <>
              <SvgLoader name='emailAlt2' className='wpchat:mb-5' />
              <TitleDescription
                title={__('Check your inbox!', 'smashballoon-wpchat-livechat-customer-support')}
                titleClassName='wpchat:mb-2 wpchat:text-green-900'
                description={__(
                  `Please check ${newsletterStatus.email} to confirm your subscription and claim your ${claimOfferTokenAmount.toLocaleString()} tokens.`,
                  'smashballoon-wpchat-livechat-customer-support',
                )}
                descriptionClassName='wpchat:mb-0 wpchat:text-green-900'
                className='wpchat:mb-0'
              />
            </>
          ) : showSuccess ? (
            <>
              <SvgLoader name='emailAlt2' className='wpchat:mb-5' />
              <TitleDescription
                title={__('Check your inbox!', 'smashballoon-wpchat-livechat-customer-support')}
                titleClassName='wpchat:mb-2 wpchat:text-green-900'
                description={__(
                  `Please check ${claimEmail} to confirm your subscription and claim your ${claimOfferTokenAmount.toLocaleString()} tokens.`,
                  'smashballoon-wpchat-livechat-customer-support',
                )}
                descriptionClassName='wpchat:mb-0 wpchat:text-green-900'
                className='wpchat:mb-0'
              />
            </>
          ) : (
            <>
              <TitleDescription
                title={__(
                  `Get ${claimOfferTokenAmount.toLocaleString()} tokens to get started when you sign up for our newsletter`,
                  'smashballoon-wpchat-livechat-customer-support',
                )}
              />

              <div className='wpchat:flex wpchat:items-start wpchat:gap-x-2'>
                <TextField
                  placeholder={__('Email Address', 'smashballoon-wpchat-livechat-customer-support')}
                  name='email-address'
                  type='email'
                  maxLength={50}
                  as='input'
                  isRequired
                  onChange={onEmailChange}
                  value={claimEmail}
                  inputClassName='wpchat:w-full wpchat:md:max-w-[288px]'
                  errorMessage={
                    hasEmailError
                      ? __(
                          'Please enter a valid email address',
                          'smashballoon-wpchat-livechat-customer-support',
                        )
                      : ''
                  }
                  isInvalid={hasEmailError}
                />
                <Button
                  variant='tertiary'
                  className='wpchat:shrink-0'
                  onPress={handleClaimDeal}
                  isDisabled={isClaimingOffer}
                >
                  {isClaimingOffer ? (
                    <>
                      <SvgLoader
                        name='spinner'
                        className='wpchat:h-4 wpchat:w-4 wpchat:animate-spin'
                      />
                      {__('Claiming...', 'smashballoon-wpchat-livechat-customer-support')}
                    </>
                  ) : (
                    <>
                      {__('Claim Deal', 'smashballoon-wpchat-livechat-customer-support')}
                      <SvgLoader name='chevronRight' className='wpchat:h-4 wpchat:w-4 wpchat:rtl:rotate-180' />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardWithLine>
      )}
      
      {/* Upgrade Card - Show when tokens are exhausted and free token claim is done */}
      {hasAccessToken && remainingTokens <= 50 && (
        <CardWithLine className='wpchat:flex wpchat:items-start wpchat:gap-3 wpchat:px-4 wpchat:pt-5 wpchat:pb-6'>
          <SvgLoader
            name='arrowUpLoading'
            className='wpchat:h-6 wpchat:w-6 wpchat:shrink-0 wpchat:fill-green-900'
          />
          <div>
            <TitleDescription
              title={__(
                'Upgrade your plan to get more Smart Search tokens',
                'smashballoon-wpchat-livechat-customer-support',
              )}
              titleClassName='wpchat:mb-2 wpchat:text-green-900'
              className='wpchat:mb-0'
            />
            <div className='wpchat:flex wpchat:items-start wpchat:gap-3'>
              <LinkButton
                variant='tertiary'
                href={window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing'}
              >
                {__('Upgrade', 'smashballoon-wpchat-livechat-customer-support')}
              </LinkButton>
              <Button variant='secondary' onPress={handleUpgradeClick}>
                {__('Learn More', 'smashballoon-wpchat-livechat-customer-support')}
                <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
              </Button>
            </div>
          </div>
        </CardWithLine>
      )}
    </>
  );
}

export default FaqToken;
