import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import { __ } from '@wordpress/i18n';
import EmbeddedFrontend from '@AC/EmbeddedFrontend';
import TitleDescription from '@Components/TitleDescription';
import { Button } from '@AC/ui/Button';
import { SideNav } from '@AC/ui/SideNav';
import SvgLoader from '@Components/SvgLoader';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { cn } from '@Utils/cn';
import { isPro } from '@Utils/isPro';

function OverviewCard() {
  const navigate = useNavigate();
  const setDisableFixed = useChatStore((s) => s.setDisableFixed);
  const setShowChat = useChatStore((s) => s.setShowChat);
  const setInitialRoute = useChatStore((s) => s.setInitialRoute);
  const setShowChatToggle = useChatStore((s) => s.setShowChatToggle);
  const setDisableNavigation = useChatStore((state) => state.setDisableNavigation);
  const setRootClassName = useChatStore((state) => state.setRootClassName);
  const setIsPreviewMode = useChatStore((s) => s.setIsPreviewMode);
  const setDisableFaqTracking = useChatStore((s) => s.setDisableFaqTracking);
  const reset = useChatStore((s) => s.reset);

  const { fetchSettings, settings } = useSettingsStore();
  const [isOpenSideNav, setIsOpenSideNav] = useState(false);
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    reset();
    setDisableFixed(true);
    setInitialRoute('/');
    setShowChatToggle(false);
    setShowChat(true);
    setIsPreviewMode(true); // Set preview mode to prevent analytics logging
    setDisableFaqTracking(true); // Disable FAQ click tracking in dashboard preview
  }, []);

  useEffect(() => {
    setDisableFixed(true);
    setShowChat(true);
    setInitialRoute('/');
    setShowChatToggle(true);
    setDisableNavigation(false);
    setRootClassName('wpchat:flex wpchat:justify-center');
    setIsPreviewMode(true); // Set preview mode to prevent analytics logging
    setDisableFaqTracking(true); // Disable FAQ click tracking in dashboard preview
  }, [isOpenSideNav]);

  const visibility = settings?.visibilitySettings;
  const isModeExclude = visibility?.mode === 'exclude';
  const isModeInclude = visibility?.mode === 'include';

  const includeValues = Object.values(visibility?.include || {});
  const excludeValues = Object.values(visibility?.exclude || {});
  const includeHasValues = includeValues.some((arr) => Array.isArray(arr) && arr.length > 0);
  const excludeHasValues = excludeValues.some((arr) => Array.isArray(arr) && arr.length > 0);
  const includeIsEmpty = includeValues.every((arr) => Array.isArray(arr) && arr.length === 0);

  // Determine if chatbot is live (visible somewhere)
  const isChatbotLive = isPro
    ? (isModeInclude || (isModeExclude && includeHasValues))
    : isModeInclude;

  // Determine title and description
  let titleText = '';
  let descriptionText = '';

  if (isChatbotLive) {
    titleText = __('Your WPChat is live', 'smashballoon-wpchat-livechat-customer-support');

    if (!isPro || (isModeInclude && !excludeHasValues)) {
      descriptionText = __('Your WPChat is live and visible on all pages.', 'smashballoon-wpchat-livechat-customer-support');
    } else if (isModeInclude && excludeHasValues) {
      descriptionText = __(
        'Your WPChat is live and visible on all pages except those you have excluded.',
        'smashballoon-wpchat-livechat-customer-support',
      );
    } else if (isModeExclude && includeHasValues) {
      descriptionText = __(
        'Your WPChat is live and visible only on the pages you have selected.',
        'smashballoon-wpchat-livechat-customer-support',
      );
    }
  } else {
    titleText = __('Your WPChat is not live', 'smashballoon-wpchat-livechat-customer-support');
    descriptionText = __('Your WPChat is currently not visible on any page(s).', 'smashballoon-wpchat-livechat-customer-support');
  }

  // Show buttons based on chatbot status
  const showCustomizerButtons = isChatbotLive;
  const showVisibilitySettingsButton = !isChatbotLive;
  return (
    <>
      <div
        className={cn(
          'wpchat:mb-4 wpchat:grid wpchat:grid-cols-1 wpchat:py-1.5 wpchat:pe-1.5 wpchat:md:grid-cols-2 wpchat:shadow-md wpchat:rounded-lg wpchat:ps-1.5 wpchat:overflow-hidden',
          {
            'wpchat:bg-red-50': showVisibilitySettingsButton,
            'wpchat:bg-blue-50': !showVisibilitySettingsButton,
          },
        )}
      >
        <div className='wpchat:relative wpchat:-mt-13 wpchat:h-[352px] wpchat:overflow-hidden wpchat:md:-me-11 wpchat:-mb-2'>
          <EmbeddedFrontend className='wpchat:scale-80' fixedHeight={580} />
          <div className='pointer-events-auto wpchat:absolute wpchat:inset-0 wpchat:z-10 wpchat:bg-transparent' />
        </div>
        <div className='wpchat:flex wpchat:w-full wpchat:items-center wpchat:rounded-md wpchat:bg-white wpchat:px-4 wpchat:pt-4 wpchat:pb-6 wpchat:md:px-10 wpchat:shadow-md wpchat:z-9'>
          <div className='wpchat:w-full'>
            <TitleDescription
              title={titleText}
              description={descriptionText}
              TitleTag='h4'
              className='wpchat:mb-5 wpchat:max-w-[300px]'
              titleClassName='wpchat:text-lg'
            />
            <div className='wpchat:flex wpchat:gap-1.5'>
              {showCustomizerButtons && (
                <>
                  <Button
                    variant='primary'
                    onPress={() => navigate('/customizer')}
                    className='wpchat:w-full wpchat:md:w-auto'
                  >
                    <SvgLoader name='editOutline' />
                    {__('Customise', 'smashballoon-wpchat-livechat-customer-support')}
                  </Button>
                  <Button
                    variant='secondary'
                    onPress={() => setIsOpenSideNav((prev) => !prev)}
                    className='wpchat:w-full wpchat:md:w-auto'
                  >
                    <SvgLoader name='displayEye' />
                    {__('Preview', 'smashballoon-wpchat-livechat-customer-support')}
                  </Button>
                </>
              )}

              {showVisibilitySettingsButton && (
                <Button
                  variant='primary'
                  onPress={() => navigate('/visibility')}
                  className='wpchat:md:w-auto'
                >
                  {__('Visibility Settings', 'smashballoon-wpchat-livechat-customer-support')}
                  <SvgLoader name='chevronRight' className='wpchat:rtl:rotate-180' />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <SideNav isOpen={isOpenSideNav} setIsOpen={setIsOpenSideNav} showLoading={true}>
        <h2 className='wpchat:text-gray-900 wpchat:border-gray-200 wpchat:m-0 wpchat:mb-9 wpchat:flex wpchat:items-center wpchat:gap-1.5 wpchat:border-b-1 wpchat:py-4 wpchat:ps-8 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold'>
          <SvgLoader
            name='chevronLeft'
            className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:cursor-pointer wpchat:rtl:rotate-180'
            onClick={() => setIsOpenSideNav(false)}
          />
          {__('Preview', 'smashballoon-wpchat-livechat-customer-support')}
        </h2>
        <EmbeddedFrontend />
      </SideNav>
    </>
  );
}

export default OverviewCard;
