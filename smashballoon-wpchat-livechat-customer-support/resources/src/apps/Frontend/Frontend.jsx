import root from 'react-shadow';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import useFaqsStore from '@FDataStore/faqs/faqsStore';
import PageRouter from '@FC/PageRouter';
import PlatformIconsToggle from '@FC/PlatformIconsToggle';
import { logChatClose, logChatOpen, logFunnelAbandon } from '@FDataStore/Chat/analyticsApi';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { useTransitions } from '@Hooks/useTransitions';
import { useIsEditingPanel } from '@FU/useIsEditingPanel';
import { cn } from '@Utils/cn';
import tailwindStyles from './frontend.css?inline';

const MAX_WIDGET_HEIGHT = 580;

const animationProps = {
  none: {},
  bounce: {
    animate: { y: [0, -10, 0] },
    transition: { repeat: Infinity, repeatDelay: 0.3, duration: 0.6, ease: 'easeInOut' },
  },
  pulse: {},
};

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
  const iconShape = useChatStore((s) => s.iconShape);
  const iconPosition = useChatStore((s) => s.iconPosition);
  const iconPositionOffsetX = useChatStore((s) => s.iconPositionOffsetX);
  const iconPositionOffsetY = useChatStore((s) => s.iconPositionOffsetY);
  const iconType = useChatStore((s) => s.iconType);
  const iconAnimation = useChatStore((s) => s.iconAnimation);
  const isEditingIconPanel = useIsEditingPanel('icon');
  const [isOpen, setIsOpen] = useState(showChat ? showChat : false);
  const [lastEscapeTime, setLastEscapeTime] = useState(0);

  const widgetRef = useRef(null);
  const defaultTransitions = useTransitions({ onTrigger: isOpen });

  // Sync isOpen with showChat continuously in preview mode (initial value handles non-preview)
  useEffect(() => {
    if (isPreviewMode) {
      setIsOpen(showChat);
    }
  }, [isPreviewMode, showChat]);

  // Prefetch platforms on mount when in platform icon mode so icons render immediately
  useEffect(() => {
    if (iconType === 'platform') {
      fetchAvailablePlatforms();
    }
  }, [iconType, fetchAvailablePlatforms]);

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
  }, [isOpen, lastEscapeTime]);

  // Track funnel abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (chatFunnelId && isOpen) {
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
        'wpchat:z-9 wpchat:flex wpchat:w-[100%] wpchat:max-w-[400px] wpchat:flex-wrap wpchat:p-5 wpchat:antialiased',
        iconPosition === 'left' ? 'wpchat:justify-start' : 'wpchat:justify-end',
        !disableFixed && 'wpchat:fixed wpchat:bottom-0 wpchat:z-99999',
        !disableFixed && (iconPosition === 'left' ? 'wpchat:start-0' : 'wpchat:end-0'),
        frontendClassName,
      )}
      style={!disableFixed ? {
        [iconPosition === 'left' ? 'insetInlineStart' : 'insetInlineEnd']: `${iconPositionOffsetX ?? 12}px`,
        bottom: `${iconPositionOffsetY ?? 12}px`,
      } : undefined}
    >
      <motion.div
        ref={widgetRef}
        {...(disableFixed
          ? {
              initial: { opacity: 1 },
              animate: { opacity: 1 },
            }
          : iconType === 'platform'
            ? {
                initial: { scale: 0.95, y: 10, opacity: 0, display: 'none' },
                animate: isOpen
                  ? { scale: 1, y: 0, opacity: 1, display: 'block' }
                  : { scale: 0.95, y: 10, opacity: 0, display: 'none' },
                transition: {
                  scale: { type: 'spring', stiffness: 350, damping: 30 },
                  y: { type: 'spring', stiffness: 350, damping: 30 },
                  opacity: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                },
                style: { transformOrigin: iconPosition === 'left' ? 'bottom left' : 'bottom right' },
              }
            : defaultTransitions)}
        className='wpchat:relative wpchat:mb-5 wpchat:w-full wpchat:overflow-hidden wpchat:rounded-2xl wpchat:shadow-md wpchat:[background:var(--wpchat-color-widget-bg)]'
        style={{
          height: getWidgetHeight(fixedHeight, chatFunnelId, widgetHeight),
          maxHeight: `${MAX_WIDGET_HEIGHT}px`,
          marginTop: getWidgetMarginTop(fixedHeight, disableFixed, widgetHeight, chatFunnelId),
          transition: 'height 0.25s cubic-bezier(0.25, 0.1, 0.25, 1), margin-top 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
          ...(disableFixed && !isOpen && !isEditingIconPanel ? { visibility: 'hidden' } : {}),
          ...(!isOpen && isEditingIconPanel ? { background: 'transparent', boxShadow: 'none' } : {}),
        }}
      >
        {/* Platform icons annotation in preview mode */}
        {!isOpen && isEditingIconPanel && (
          <div className="wpchat:relative wpchat:flex wpchat:h-full wpchat:flex-col wpchat:items-center wpchat:justify-end wpchat:rounded-2xl wpchat:p-5 wpchat:pb-5">
            {/* Custom dashed border via SVG for precise dash control */}
            <svg className="wpchat:pointer-events-none wpchat:absolute wpchat:inset-0 wpchat:h-full wpchat:w-full" preserveAspectRatio="none">
              <rect
                x="0.5" y="0.5"
                width="calc(100% - 1px)" height="calc(100% - 1px)"
                rx="16" ry="16"
                fill="var(--wpchat-color-gray-100)"
                stroke="var(--wpchat-color-gray-500)"
                strokeWidth="1"
                strokeDasharray="8 6"
              />
            </svg>
            <p className={cn(
              'wpchat:m-0 wpchat:max-w-[155px] wpchat:text-center wpchat:text-sm wpchat:leading-[130%] wpchat:text-gray-500 wpchat:relative wpchat:z-1',
              iconPosition === 'left' ? 'wpchat:rotate-10 wpchat:-left-8' : 'wpchat:rotate-350 wpchat:left-8',
            )}>
              {iconType === 'platform'
                ? 'Platform icons that show up when the chatbot is closed'
                : 'Custom icon that shows up when the chatbot is closed'}
            </p>
            <SvgLoader
              name="longAngledArrowDown"
              className={cn(
                'wpchat:mt-2 wpchat:h-[46px] wpchat:w-[15px] wpchat:fill-gray-500 wpchat:z-1 wpchat:relative',
                iconPosition === 'left' ? 'wpchat:-left-18 wpchat:-scale-x-100' : 'wpchat:left-18',
              )}
            />
          </div>
        )}
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
        iconType === 'platform' ? (
          <PlatformIconsToggle
            isOpen={isOpen}
            onToggle={handleChatToggle}
            iconShape={iconShape}
            iconPosition={iconPosition}
            iconAnimation={iconAnimation}
          />
        ) : (
          // Pulse-ring lives on an outer wrapper because the button below sets
          // overflow-hidden (needed to clip the SVG's rectangular background to
          // the rounded shape) — which would otherwise clip the pulse's ::before
          // ring as it expands outward.
          <div
            className={cn(
              'wpchat:relative wpchat:inline-flex',
              iconShape === 'roundedRectangle' ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
              !isOpen && iconAnimation === 'pulse' && 'pulse-ring',
            )}
            style={{
              '--pulse-radius': iconShape === 'roundedRectangle' ? '16px' : '100px',
              '--pulse-inset': '-4px',
            }}
          >
            <motion.button
              onClick={(e) => {
                e.currentTarget.blur();
                handleChatToggle();
              }}
              className={cn(
                'wpchat:relative wpchat:inline-flex wpchat:h-12 wpchat:w-12 wpchat:cursor-pointer wpchat:items-center wpchat:justify-center wpchat:overflow-hidden wpchat:transition wpchat:hover:scale-105 wpchat:active:scale-98',
                iconShape === 'roundedRectangle' ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
              )}
              {...(!isOpen ? animationProps[iconAnimation] || {} : {})}
            >
              {isOpen ? (
                /* Mirror PlatformIconsToggle's close overlay 1:1:
                   gradient bg + a SEPARATE inner div for the inset highlight
                   so the bevel renders cleanly above the gradient, plus the
                   centered white chevron. */
                <div
                  className={cn(
                    'wpchat:absolute wpchat:inset-0 wpchat:flex wpchat:items-center wpchat:justify-center wpchat:overflow-hidden',
                    iconShape === 'roundedRectangle' ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
                  )}
                  style={{ background: 'var(--wpchat-color-close-button-gradient)' }}
                >
                  <div
                    className={cn(
                      'wpchat:absolute wpchat:inset-0 wpchat:pointer-events-none',
                      iconShape === 'roundedRectangle' ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
                    )}
                    style={{ boxShadow: 'inset 1px 1px 2px 0 rgba(255,255,255,0.45)' }}
                  />
                  <SvgLoader name="chevronDown" className="wpchat:h-9 wpchat:w-9 wpchat:fill-white" />
                </div>
              ) : (
                <SvgLoader
                  name={chatToggleIcon}
                  className='wpchat:h-full wpchat:w-full wpchat:fill-widget-accent wpchat:bg-widget-accent'
                />
              )}
            </motion.button>
          </div>
        )
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
