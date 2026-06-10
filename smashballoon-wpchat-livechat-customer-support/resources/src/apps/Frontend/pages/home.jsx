import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Reorder } from 'motion/react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import HomeSkeleton from '@FC/Skeleton/HomeSkeleton';
import ChatFAQ from '@FC/ChatFAQ';
import ChatSubSection from '@FC/ChatSubSection';
import { getInitialMessages } from '@FC/getInitialMessages';
import { logCTANavigation } from '@FDataStore/Chat/analyticsApi';
import { useChatStore, useChatStoreApi } from '@Frontend/context/ChatStoreContext';
import { useWidgetHeight } from '@FU/useWidgetHeight';
import { useIsEditingPanel } from '@FU/useIsEditingPanel';
import { cn } from '@Utils/cn';
import { getLocalizeVariables } from '@Utils/getLocalizeVariables';
import useSettingsStore from '@DataStore/settings/settingsStore';
import useFaqsStore from '@FDataStore/faqs/faqsStore';

// Extra height added to content to account for widget UI elements (header/footer spacing)
const WIDGET_HEIGHT_BUFFER = 70;
const WIDGET_MAX_HEIGHT = 580;

// import your fetch function here
/**
 * Home component serves as the main landing page of the application.
 *
 * @component
 * @returns {JSX.Element} The rendered Home component.
 */
export default function Home() {
  const navigate = useNavigate();
  const mode = location.hash.includes('/create') ? 'create' : 'edit';
  // Zustand store values
  const sendMessageIcon = useChatStore((s) => s.sendMessageIcon);
  const sendMessageHeading = useChatStore((s) => s.sendMessageHeading);
  const sendMessageSubHeading = useChatStore((s) => s.sendMessageSubHeading);
  const headerHeading = useChatStore((s) => s.headerHeading);
  const reorderableKeys = useChatStore((s) => s.reorderableKeys);
  const setReorderableKeys = useChatStore((s) => s.setReorderableKeys);
  const visibleMap = useChatStore((s) => s.visibleMap);
  const headerHeadingClasses = useChatStore((s) => s.headerHeadingClasses);
  const setNavigateTo = useChatStore((s) => s.setNavigateTo);
  const chatFunnelId = useChatStore((s) => s.chatFunnelId);
  const funnel = useChatStore((s) => s.funnel);
  const wpChatBranding = useChatStore((s) => s.wpChatBranding);
  const reorder = useChatStore((s) => s.reorder);
  const settings = useSettingsStore((s) => s.settings);
  const totalFaqs = useFaqsStore((s) => s.totalFaqs);
  const initialLoadComplete = useFaqsStore((s) => s.initialLoadComplete);
  const route = useChatStore((s) => s.route);
  const setWidgetHeight = useChatStore((s) => s.setWidgetHeight);
  const isEditingFaqPanel = useIsEditingPanel('frequentQuestions');

  // Get available platforms and off-hours data from Zustand store (pre-fetched by Frontend.jsx)
  const availablePlatforms = useChatStore((s) => s.availablePlatforms);
  const offHoursData = useChatStore((s) => s.offHoursData);
  const platformsLoading = useChatStore((s) => s.platformsLoading);

  // Dynamic height calculation ref
  const containerRef = useRef(null);

  // Data is still loading if platforms haven't arrived yet
  const isInitialLoad = availablePlatforms === null;

  useEffect(() => {
    // Check if there's a funnel to load
    const funnelId = chatFunnelId ? chatFunnelId : getLocalizeVariables('funnelId');

    if (funnelId || mode === 'create') {
      // Navigate to chat with funnel information, but don't process the funnel yet
      // The funnel will be processed and logged in the Chat component
      navigate('/chat', {
        state: {
          funnelId,
          funnelData: mode === 'create' ? funnel : null,
          mode
        }
      });
    }
  }, [chatFunnelId]);

  // Get store API for passing to getInitialMessages
  const storeApi = useChatStoreApi();

  const botMsg = getInitialMessages(availablePlatforms, offHoursData, storeApi);

  const handleChatSectionClick = () => {
    // Log enhanced CTA navigation event
    logCTANavigation('home', 'chat', 'start_chat_button');
    navigate('/chat', { state: { msg: botMsg } });
  };

  const handleReorder = (newOrder) => {
    const validKeys = newOrder.filter((key) => key in componentsMap);
    setReorderableKeys(validKeys);
  };

  useEffect(() => {
    // Register navigate with Zustand on mount
    setNavigateTo((route, state) => {
      navigate(route, { state });
    });
  }, [navigate]);

  const renderSendMessage = () => {
    // Use the same dynamic platform list everywhere
    const platformsToShow = availablePlatforms || [];

    return (
      <ChatSubSection onClick={handleChatSectionClick} className="wpchat:pr-9">
        {sendMessageIcon && platformsToShow.length > 0 && !platformsLoading && (
          <ul className='wpchat:flex wpchat:cursor-pointer wpchat:gap-3 wpchat:mb-5 wpchat:items-center wpchat:min-h-[22px]'>
            {platformsToShow.map((platform) => (
              <li key={platform} className='wpchat:flex wpchat:h-[22px] wpchat:w-[22px] wpchat:items-center wpchat:justify-center'>
                <SvgLoader
                  name={platform}
                  className='wpchat:h-[22px] wpchat:w-[22px] wpchat:fill-widget-icon'
                />
              </li>
            ))}
          </ul>
        )}
        {sendMessageHeading && (
          <h6 className='wpchat:m-0 wpchat:text-base wpchat:font-semibold wpchat:text-widget-text-1'>
            {sendMessageHeading}
          </h6>
        )}
        {sendMessageSubHeading && (
          <p className='wpchat:text-sm wpchat:text-widget-text-2'>{sendMessageSubHeading}</p>
        )}
        <SvgLoader
          name='chevronRight'
          className='wpchat:absolute wpchat:top-1/2 wpchat:end-[12px] wpchat:h-[32px] wpchat:w-[32px] wpchat:-translate-y-1/2 wpchat:cursor-pointer wpchat:fill-widget-icon-1 wpchat:rtl:rotate-180'
        />
      </ChatSubSection>
    );
  };

  const renderFAQ = () => {
    // Hide FAQ section when there are no FAQs, unless editing the FAQ panel in customizer
    if (initialLoadComplete && totalFaqs === 0 && !isEditingFaqPanel) {
      return null;
    }
    return <ChatFAQ />;
  };

  // TODO: Replace placeholder when we start implementing AI features
  const renderTalkToAi = () => <>talk to ai</>;

  const renderWpChatBranding = () => {
    const brandingUrl = getLocalizeVariables('brandingLogoUrl') || 'https://wpchat.com/?utm_campaign=wpchat-logo&utm_source=wpchat-plugin&utm_medium=wpchat-widget&utm_content=powered-by-wpchat';

    return (
      <div className='wpchat:flex wpchat:items-center wpchat:justify-center wpchat:px-2.5 wpchat:absolute wpchat:bottom-0 wpchat:start-0 wpchat:bg-widget-bg-1 wpchat:w-full wpchat:border-t wpchat:border-widget-border wpchat:backdrop-blur'>
        <a
          href={brandingUrl}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={__('Powered by WPChat - Visit wpchat.com', 'smashballoon-wpchat-livechat-customer-support')}
        >
          <SvgLoader name={wpChatBranding} />
        </a>
      </div>
    );
  };

  const componentsMap = {
    sendMessage: renderSendMessage,
    frequentQuestions: renderFAQ,
    // talktoai: renderTalkToAi,
    wpChatBranding: renderWpChatBranding
  };

  // Memoize filtered keys to avoid recalculating on every render
  // Always show FAQ section when editing FAQ panel with no FAQs (to display dummy FAQs)
  const filteredKeys = useMemo(
    () => reorderableKeys.filter((key) => {
      if (key === 'wpChatBranding') return false;
      // Always show FAQ section when editing with no FAQs, regardless of visibility
      if (key === 'frequentQuestions' && isEditingFaqPanel && totalFaqs === 0) return true;
      return visibleMap?.[key] !== false;
    }),
    [reorderableKeys, visibleMap, isEditingFaqPanel, totalFaqs]
  );

  // Get content height (no clamping to avoid jumps)
  const { height: calculatedHeight } = useWidgetHeight(containerRef, {
    dependencies: [isInitialLoad, platformsLoading, totalFaqs, filteredKeys, route, initialLoadComplete],
  });

  // Push calculated height to store for parent component
  useEffect(() => {
    if (calculatedHeight) {
      const adjustedHeight = Math.min(calculatedHeight + WIDGET_HEIGHT_BUFFER, WIDGET_MAX_HEIGHT);
      setWidgetHeight(adjustedHeight);
    }
  }, [calculatedHeight, setWidgetHeight]);

  return (
    <div
      ref={containerRef}
      className={cn('wpchat:p-3 wpchat:[background:var(--wpchat-color-background)]', visibleMap?.wpChatBranding && 'wpchat:pb-10')}
    >
      {isInitialLoad && platformsLoading ? (
        <HomeSkeleton />
      ) : (
        <>
          {headerHeading && (
            <h2
              className={cn(
                'wpchat:bg-clip-text wpchat:text-4xl wpchat:font-semibold wpchat:text-transparent',
                headerHeadingClasses,
              )}
              style={{
                background: 'var(--wpchat-color-widget-heading)',
                WebkitBackgroundClip: 'text',
              }}
            >
              {headerHeading}
            </h2>
          )}
          {/* Conditionally reorderable sections (branding excluded) */}
          {reorder ? (
            <Reorder.Group axis="y" values={reorderableKeys} onReorder={handleReorder}>
              {filteredKeys.map((key) => (
                <Reorder.Item key={key} value={key}>
                  {componentsMap[key]()}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            filteredKeys.map((key) => (
              <div key={key}>
                {componentsMap[key]()}
              </div>
            ))
          )}
          {/* Branding (no animation, hide/show works) */}
          {visibleMap?.wpChatBranding && renderWpChatBranding()}
        </>
      )}
    </div>
  );
}