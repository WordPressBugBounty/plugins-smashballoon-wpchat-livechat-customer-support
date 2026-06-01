import root from 'react-shadow';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import useFaqsStore from '@FDataStore/faqs/faqsStore';
import PageRouter from '@FC/PageRouter';
import { logChatClose, logChatOpen, logFunnelAbandon } from '@FDataStore/Chat/analyticsApi';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { useTransitions } from '@Hooks/useTransitions';
import { cn } from '@Utils/cn';
import tailwindStyles from './frontend.css?inline';

const MAX_WIDGET_HEIGHT = 580;

/**
 * Calculate widget height based on various states
 */
function getWidgetHeight(fixedHeight, chatFunnelId, widgetHeight) {
  if (fixedHeight) {
    return `${fixedHeight}px`;
  }
  if (chatFunnelId) {
    return `${MAX_WIDGET_HEIGHT}px`;
  }
  if (widgetHeight) {
    return `${widgetHeight}px`;
  }
  return 'auto';
}

/**
 * Calculate margin top for widget positioning
 */
function getWidgetMarginTop(fixedHeight, disableFixed, widgetHeight, chatFunnelId) {
  if (!fixedHeight && disableFixed && widgetHeight && !chatFunnelId) {
    return `${Math.max(0, MAX_WIDGET_HEIGHT - widgetHeight)}px`;
  }
  return undefined;
}

/**
 * Frontend component manages the chat UI, including the chat window and toggle button.
 *
 * @component
 * @returns {JSX.Element} The rendered Frontend chat component.
 */
function Frontend({ fixedHeight }) {
  const disableFixed = useChatStore((s) => s.disableFixed);
  const showChat = useChatStore((s) => s.showChat);
  const isPreviewMode = useChatStore((s) => s.isPreviewMode);
  const showChatToggle = useChatStore((s) => s.showChatToggle);
  const disableChatToggle = useChatStore((s) => s.disableChatToggle);
  const chatToggleIcon = useChatStore((s) => s.chatToggleIcon);
  const theme = useChatStore((s) => s.theme);
  const frontendClassName = useChatStore((s) => s.frontendClassName);
  const chatFunnelId = useChatStore((s) => s.chatFunnelId);
  const chatFunnelLastBlockOrder = useChatStore((s) => s.chatFunnelLastBlockOrder || 1);
  const widgetHeight = useChatStore((s) => s.widgetHeight);
  const fetchAvailablePlatforms = useChatStore((s) => s.fetchAvailablePlatforms);
  const [isOpen, setIsOpen] = useState(showChat ? showChat : false);
  const [lastEscapeTime, setLastEscapeTime] = useState(0);

  const widgetRef = useRef(null);

  // Sync isOpen with showChat continuously in preview mode (initial value handles non-preview)
  useEffect(() => {
    if (isPreviewMode) {
      setIsOpen(showChat);
    }
  }, [isPreviewMode, showChat]);

  // Pre-fetch platforms and FAQs as soon as widget opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailablePlatforms();
      useFaqsStore.getState().loadInitialFaqs();
    }
  }, [isOpen]);

  // Double escape handler to toggle chat (only when open)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        const now = Date.now();
        if (now - lastEscapeTime < 300) {
          handleChatToggle();
          setLastEscapeTime(0);
        } else {
          setLastEscapeTime(now);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Track funnel abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't log abandonment if user is being redirected to platform
      if (chatFunnelId && isOpen && !window.wpChatPlatformRedirecting) {
        // Use navigator.sendBeacon for reliable tracking when page unloads
        logFunnelAbandon(
          chatFunnelId,
          '', // Empty funnel_name - backend will populate from database
          chatFunnelLastBlockOrder,
          'page_unload',
          {
            source: 'page_navigation',
            reason: 'browser_navigation',
          },
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chatFunnelId, isOpen, chatFunnelLastBlockOrder]);

  // Handle chat toggle with analytics
  const handleChatToggle = () => {
    if (disableChatToggle) {
      return;
    }

    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      logChatOpen('chat_widget');
    } else {
      logChatClose('user_action');

      // Log funnel abandonment if there was an active funnel
      if (chatFunnelId) {
        logFunnelAbandon(
          chatFunnelId,
          '', // Empty funnel_name - backend will populate from database
          chatFunnelLastBlockOrder,
          'chat_closed',
          {
            source: 'chat_toggle',
            reason: 'user_closed_chat',
          },
        );
      }
    }
  };

  return (
    <div
      data-theme={theme}
      className={cn(
        'wpchat:z-9 wpchat:flex wpchat:w-[100%] wpchat:max-w-[400px] wpchat:flex-wrap wpchat:justify-end wpchat:p-5 wpchat:antialiased',
        !disableFixed && 'wpchat:fixed wpchat:end-0 wpchat:bottom-0 wpchat:z-99999',
        frontendClassName,
      )}
    >
      <motion.div
        ref={widgetRef}
        {...(disableFixed
          ? {
              initial: { opacity: 1 },
              animate: { opacity: 1 },
            }
          : useTransitions({ onTrigger: isOpen }))}
        className='wpchat:relative wpchat:mb-5 wpchat:w-full wpchat:overflow-hidden wpchat:rounded-2xl wpchat:shadow-md wpchat:[background:var(--wpchat-color-widget-bg)]'
        style={{
          height: getWidgetHeight(fixedHeight, chatFunnelId, widgetHeight),
          maxHeight: `${MAX_WIDGET_HEIGHT}px`,
          marginTop: getWidgetMarginTop(fixedHeight, disableFixed, widgetHeight, chatFunnelId),
          transition: 'height 0.25s cubic-bezier(0.25, 0.1, 0.25, 1), margin-top 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
          ...(disableFixed && !isOpen ? { visibility: 'hidden' } : {}),
        }}
      >
        {/* Only render PageRouter when chat is actually open to prevent premature funnel processing */}
        {isOpen && (
          <>
            <button
              onClick={handleChatToggle}
              className='wpchat:absolute wpchat:end-3 wpchat:top-3 wpchat:z-9 wpchat:cursor-pointer wpchat:rounded-xl wpchat:border-0 wpchat:bg-transparent wpchat:p-2 wpchat:transition-all wpchat:hover:bg-widget-bg-3'
              aria-label={__('Close Chat', 'smashballoon-wpchat-livechat-customer-support')}
            >
              <SvgLoader
                name='closeRounded'
                className='wpchat:h-[1.7em] wpchat:w-[1.7em] wpchat:fill-widget-alt-accent'
              />
            </button>
            <PageRouter />
          </>
        )}
      </motion.div>

      {/* Chat Toggle Button */}
      {showChatToggle && (
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            handleChatToggle();
          }}
          className='wpchat:relative wpchat:end-2 wpchat:inline-flex wpchat:h-14 wpchat:w-14 wpchat:cursor-pointer wpchat:items-center wpchat:justify-center wpchat:rounded-full wpchat:transition wpchat:hover:scale-105 wpchat:active:scale-98'
        >
          <SvgLoader
            name={isOpen ? 'chatBubbleChevronDown' : chatToggleIcon}
            className='wpchat:h-full wpchat:w-full wpchat:fill-widget-accent'
          />
        </button>
      )}
    </div>
  );
}

export default function FrontendShadow({ fixedHeight }) {
  const rootClassName = useChatStore((s) => s.rootClassName);
  const brandColor = useChatStore((s) => s.brandColor);
  const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

  return (
    <React.StrictMode>
      <root.div
        className={cn('', rootClassName)}
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          ...(brandColor != null && { '--wpchat-color-brand': brandColor }),
        }}
      >
        <style>{`${tailwindStyles}`}</style>
        <Frontend fixedHeight={fixedHeight} />
      </root.div>
    </React.StrictMode>
  );
}
