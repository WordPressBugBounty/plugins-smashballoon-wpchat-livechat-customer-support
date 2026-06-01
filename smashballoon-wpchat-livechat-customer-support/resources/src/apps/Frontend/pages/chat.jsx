import React, { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import ChatBubble from '@FC/ChatBubble';
import ChatHeader from '@FC/ChatHeader';
import ChatInput from '@FC/ChatInput';
import ChatConversationIntro from '@FC/ChatConversationIntro';
import ChatDateSeparator from '@FC/ChatDateSeparator';
import ChatNewMessagesSeparator from '@FC/ChatNewMessagesSeparator';
import ChatSkeleton from '@FC/Skeleton/ChatSkeleton';
import ScrollableSection from '@FC/ScrollableSection';
import SvgLoader from '@Components/SvgLoader';
import TypingIndicator from '@FC/TypingIndicator';
import { useChatStore, useChatStoreApi } from '@Frontend/context/ChatStoreContext';
import { useTransitions } from '@Hooks/useTransitions';
import { cn } from '@Utils/cn';
import { logMessageSend, logFunnelView } from '@FDataStore/Chat/analyticsApi';
import { fetchFunnel } from '@FDataStorePro/funnels/funnelsApi';
import { createChatMessage } from '@FU/createChatMessage';
import { convertFunnelToChatMessage } from '@UtilsPro/convertFunnelToChatMessage';
import {
  clearExpiredData,
  initSession,
  saveConversation,
  hasOldConversations,
  getOldConversations,
  getOldConversationsDisplayDate,
} from '@FU/conversationStorage';

/**
 * AnimatedChatBubble wraps ChatBubble with transition animation.
 * This is a separate component to ensure hooks are called at top level.
 */
const AnimatedChatBubble = ({ msg, setChatMessages }) => {
  const transition = useTransitions({ onTrigger: msg });
  return (
    <motion.div {...transition}>
      <ChatBubble msg={msg} setChatMessages={setChatMessages} />
    </motion.div>
  );
};

/**
 * Chat component provides a user interface for messaging, including displaying messages and sending new ones.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered Chat component.
 */
export default function Chat() {
  const [message, setMessage] = useState('');
  const setChatMessages = useChatStore((s) => s.setChatMessages);
  const chatMessages = useChatStore((s) => s.chatMessages);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef(null);
  const location = useLocation();
  const routerData = location?.state;

  // Conversation history state
  const [showOldMessagesButton, setShowOldMessagesButton] = useState(false);
  const [oldMessages, setOldMessages] = useState([]);
  const [oldMessagesDisplayDate, setOldMessagesDisplayDate] = useState(null);
  const scrollPositionRef = useRef(null);
  const isPreviewMode = useChatStore((s) => s.isPreviewMode);
  const instanceId = useChatStore((s) => s.instanceId);

  // Check if user has interacted (sent a message via typing, option click, or FAQ selection)
  const hasUserInteracted = chatMessages.some((m) => m.messageType === 'send');

  // Zustand store values
  const response = useChatStore((s) => s.response);
  const replaceMode = useChatStore((s) => s.replaceMode);
  const showChatInput = useChatStore((s) => s.showChatInput);
  const chatbotName = useChatStore((s) => s.chatbotName);
  const setWidgetHeight = useChatStore((s) => s.setWidgetHeight);
  const initialMsg = routerData?.msg;

  // Get store API for imperative operations
  const storeApi = useChatStoreApi();

  // Set fixed widget height for chat page
  useEffect(() => {
    setWidgetHeight(580);
  }, [setWidgetHeight]);

  // On mount: clear expired data, archive previous messages, check for old conversations
  useEffect(() => {
    if (isPreviewMode) return;
    clearExpiredData(instanceId);
    initSession(instanceId); // Move current to archive immediately
    if (hasOldConversations(instanceId)) {
      setShowOldMessagesButton(true);
    }
  }, [isPreviewMode, instanceId]);

  // Save messages to localStorage whenever they change (frontend only, after user interaction)
  useEffect(() => {
    if (!isPreviewMode && hasUserInteracted && chatMessages.length > 0) {
      saveConversation(chatMessages, instanceId);
    }
  }, [chatMessages, isPreviewMode, hasUserInteracted, instanceId]);

  // Keep scroll position after old messages are loaded (stay viewing current messages)
  useLayoutEffect(() => {
    if (scrollPositionRef.current && scrollContainerRef.current) {
      const { scrollHeight: oldScrollHeight, scrollTop: oldScrollTop } = scrollPositionRef.current;
      scrollPositionRef.current = null;
      const container = scrollContainerRef.current;

      let rafId1;
      let rafId2;

      // Double rAF - wait for 2 frames to ensure DOM is fully rendered
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
            container.style.visibility = 'visible';
          }
        });
      });

      return () => {
        cancelAnimationFrame(rafId1);
        if (rafId2) cancelAnimationFrame(rafId2);
      };
    }
  }, [oldMessages]);

  const initialResponse = response || routerData?.response;
  const initialReplaceMode = replaceMode || routerData?.replaceMode;

  // Process funnel data if present in route state (from Home component)
  useEffect(() => {
    const processFunnel = async () => {
      const { funnelId, funnelData, mode } = routerData || {};

      if (!funnelId && !funnelData) return;

      try {
        let currentFunnel;
        
        if (mode === 'create') {
          currentFunnel = funnelData;
        } else {
          currentFunnel = await fetchFunnel(funnelId);
        }

        if (!currentFunnel) return;

        // Log funnel view analytics NOW (when user actually sees the chat)
        if (funnelId && currentFunnel) {
          const firstBlock = currentFunnel.blocks?.reduce((min, block) =>
            parseInt(block.block_order) < parseInt(min.block_order) ? block : min
          );

          // Set funnel ID and initial block order in store
          const { setChatFunnelId, setChatFunnelLastBlockOrder, setDisableNavigation } = storeApi.getState();
          setChatFunnelId(funnelId);
          setChatFunnelLastBlockOrder(firstBlock?.block_order || 1);
          setDisableNavigation(true); // Prevent user from navigating back when funnel is active
          
          logFunnelView(funnelId, currentFunnel.name || '', {
            source: 'chat_opened',
            mode: mode || 'view',
            starting_block: firstBlock?.block_order,
            total_blocks: currentFunnel.blocks?.length || 0,
          });
        }

        // Convert funnel to chat message
        const rootMessageObj = convertFunnelToChatMessage(
          currentFunnel,
          funnelId,
          currentFunnel?.name || null, // Let convertFunnelToChatMessage handle missing name
          storeApi // Pass store API for correct instance state management
        );

        const chatFunnel = createChatMessage(
          rootMessageObj.message,
          rootMessageObj.optionsList,
          'receive',
          true,
          rootMessageObj.images,
          rootMessageObj.verifiedQuote,
        );

        // Set the funnel message as the initial message
        setChatMessages([chatFunnel]);
      } catch (error) {
        console.error('Error processing funnel in chat:', error);
      }
    };

    processFunnel();
  }, [routerData, storeApi]);

  useEffect(() => {
    if (!initialMsg?.directAnswer || !initialMsg?.message) return;

    const userMsg = { ...initialMsg };
    const receivedMsg = { ...initialResponse };

    const updateMessages = () => {
      if (initialReplaceMode) {
        setChatMessages(receivedMsg ? [userMsg, receivedMsg] : [userMsg]);
      } else {
        setChatMessages([userMsg]);
        if (Object.keys(receivedMsg).length === 0) return; // nothing to append
        setLoading(true);
        setTimeout(() => {
          setChatMessages((prev) => [...prev, receivedMsg]); // Append response later
          setLoading(false);
        }, 1000);
      }
    };

    updateMessages();
  }, [initialMsg, initialResponse, initialReplaceMode]);

  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages, loading]);

  const handleChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      const msg = {
        message,
        messageType: 'send',
      };

      setChatMessages((prev) => [...prev, { ...msg }]);

      // Log message send event
      logMessageSend(message);

      setMessage('');
      setLoading(true);

      setTimeout(() => {
        const receivedMsg = {
          message: __('Got it!.. But, have no clue', 'smashballoon-wpchat-livechat-customer-support'),
          messageType: 'receive',
          images: [],
          verifiedQuote: false,
        };
        setChatMessages((prev) => [...prev, { ...receivedMsg }]);
        setLoading(false);
      }, 1000);
    }
  }, [message]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Handler for loading old conversations
  const handleLoadOldMessages = useCallback(() => {
    // Load only from archive (old messages from previous sessions)
    const archived = getOldConversations(instanceId) || [];
    const displayDate = getOldConversationsDisplayDate(instanceId);

    // Hide button regardless
    setShowOldMessagesButton(false);

    // Only proceed with scroll handling if there are messages
    if (archived.length === 0 || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const oldScrollHeight = container.scrollHeight;
    const oldScrollTop = container.scrollTop;

    // Hide container to prevent visible glitch
    container.style.visibility = 'hidden';

    // Store for later adjustment after animations
    scrollPositionRef.current = { scrollHeight: oldScrollHeight, scrollTop: oldScrollTop };

    setOldMessages(archived);
    setOldMessagesDisplayDate(displayDate);
  }, [instanceId]);

  return (
    <div className='wpchat:rounded-2xl'>
      <ChatHeader />
      <div
        className={cn(
          'wpchat:relative wpchat:h-[514px] wpchat:min-h-[514px] wpchat:rounded-ss-2xl wpchat:rounded-se-2xl wpchat:bg-white wpchat:px-4 wpchat:py-5 wpchat:text-black',
          !showChatInput && 'wpchat:pb-0', // remove bottom padding if chat input hidden
          showChatInput && 'wpchat:pb-20', // add bottom padding if chat input shown
        )}
      >
        <ScrollableSection>
          <div
            ref={scrollContainerRef}
            className={cn(
              'wpchat:overflow-y-auto',
              showChatInput ? 'wpchat:h-[410px]' : 'wpchat:h-[493px]',
            )}
          >
            {/* View older messages button */}
            {showOldMessagesButton && (
              <div className='wpchat:flex wpchat:justify-center wpchat:mb-6.5'>
                <button
                  onClick={handleLoadOldMessages}
                  className="wpchat:group wpchat:flex wpchat:cursor-pointer wpchat:items-center wpchat:mt-0 wpchat:px-3 wpchat:py-1 wpchat:rounded-2xl wpchat:border wpchat:border-solid wpchat:border-widget-border-accent wpchat:bg-transparent wpchat:text-sm wpchat:text-widget-accent-1 wpchat:font-semibold wpchat:shadow-md wpchat:shadow-widget-shadow-accent wpchat:transition-all wpchat:hover:border-widget-border-accent-2 wpchat:hover:scale-102 wpchat:active:scale-98"
                >
                  <SvgLoader
                    name="history"
                    className="wpchat:h-4 wpchat:w-4 wpchat:fill-widget-accent-1 wpchat:me-2"
                  />
                  {__('View older messages', 'smashballoon-wpchat-livechat-customer-support')}
                </button>
              </div>
            )}

            {/* Old messages from previous session */}
            {oldMessages.length > 0 && (
              <>
                <ChatConversationIntro />
                <ChatDateSeparator displayDate={oldMessagesDisplayDate} />
                {oldMessages.map((msg, index) =>
                  msg ? (
                    <AnimatedChatBubble
                      key={`old-${index}`}
                      msg={msg}
                      setChatMessages={setChatMessages}
                    />
                  ) : null,
                )}
                <ChatNewMessagesSeparator />
              </>
            )}

            {/* Skeleton while messages are being set */}
            {chatMessages.length === 0 && <ChatSkeleton />}

            {/* Current session messages */}
            {chatMessages.map(
              (msg, index) =>
                msg && (
                  <AnimatedChatBubble key={index} msg={msg} setChatMessages={setChatMessages} />
                ),
            )}
            <Suspense fallback={null}>
              {loading && chatbotName && <TypingIndicator agentName={chatbotName} />}
            </Suspense>
          </div>
        </ScrollableSection>
        {showChatInput && (
          <div className='wpchat:absolute wpchat:bottom-0 wpchat:start-0 wpchat:w-full wpchat:px-4 wpchat:pb-4'>
            <ChatInput
              inputPlaceholder={__('Type a message', 'smashballoon-wpchat-livechat-customer-support')}
              message={message}
              handleChange={handleChange}
              handleKeyDown={handleKeyDown}
              handleSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
