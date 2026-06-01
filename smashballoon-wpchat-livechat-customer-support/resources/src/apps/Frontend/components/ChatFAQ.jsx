import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import ChatSubSection from '@FC/ChatSubSection';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { useTransitions } from '@Hooks/useTransitions';
import { cn } from '@Utils/cn';
import useFaqsStore from '@FDataStore/faqs/faqsStore';
import { logNavigation } from '@FDataStore/Chat/analyticsApi';
import { useIsEditingPanel } from '@FU/useIsEditingPanel';

// Dummy FAQs for preview mode when no real FAQs exist
const DUMMY_FAQS = [
  { id: 'dummy-1', question: __('What should I add here?', 'smashballoon-wpchat-livechat-customer-support'), answer: __('This is a sample answer for preview purposes.', 'smashballoon-wpchat-livechat-customer-support') },
  { id: 'dummy-2', question: __('How many FAQs should I have?', 'smashballoon-wpchat-livechat-customer-support'), answer: __('This is a sample answer for preview purposes.', 'smashballoon-wpchat-livechat-customer-support') },
  { id: 'dummy-3', question: __("What if I don't have any FAQs yet?", 'smashballoon-wpchat-livechat-customer-support'), answer: __('This is a sample answer for preview purposes.', 'smashballoon-wpchat-livechat-customer-support') },
  { id: 'dummy-4', question: __('Can I reorder or edit these later?', 'smashballoon-wpchat-livechat-customer-support'), answer: __('This is a sample answer for preview purposes.', 'smashballoon-wpchat-livechat-customer-support') },
];

/**
 * ChatFAQ component displays frequently asked questions in the chat.
 *
 * @component
 * @returns {JSX.Element} The rendered ChatFAQ component.
 */
export default function ChatFAQ() {
  const navigate = useNavigate();

  const faqHeading = useChatStore((s) => s.faqHeading);
  const searchBorder = useChatStore((s) => s.searchBorder);
  const [searchTerm, setSearchTerm] = useState('');
  const disableFaqTracking = useChatStore((s) => s.disableFaqTracking);
  const isEditingFaqPanel = useIsEditingPanel('frequentQuestions');

  // Get state and actions from the store
  const {
    faqs,
    searchResults,
    loading,
    searchLoading,
    error,
    searchError,
    totalFaqs,
    loadInitialFaqs,
    searchFaqs,
    clearSearch,
    trackFaqClick,
    isTrackingClick
  } = useFaqsStore();

  // Load initial FAQs when component mounts
  useEffect(() => {
    loadInitialFaqs();
  }, []);

  // Handle search term changes
  useEffect(() => {
    if (!searchTerm) {
      clearSearch();
      return;
    }

    const timeout = setTimeout(() => {
      searchFaqs(searchTerm);
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Handle FAQ click
  const handleFaqClick = (faq, userMsg, botMsg) => {
    if (isTrackingClick()) return;

    // Track click if enabled
    if (!disableFaqTracking) {
      trackFaqClick(faq.id, faq.question);
    }

    // Log enhanced navigation event with FAQ context
    logNavigation('faq', 'chat', {
      navigation_type: 'faq_selection',
      navigation_trigger: 'faq_click',
      faq_id: faq.id,
      faq_question: faq.question,
      trigger_type: 'faq_selection',
    });

    // Navigate to chat
    navigate('/chat', {
      state: {
        msg: userMsg,
        response: botMsg,
        source: 'faq',
        faqId: faq.id
      }
    });
  };

  // Determine which FAQs to display (use dummy FAQs only when editing FAQ panel in customizer)
  const isShowingDummyFaqs = isEditingFaqPanel && faqs.length === 0 && !searchTerm;
  const displayedFaqs = useMemo(() => {
    if (searchTerm) return searchResults;
    if (faqs.length > 0) return faqs;
    if (isEditingFaqPanel) return DUMMY_FAQS;
    return [];
  }, [searchTerm, searchResults, faqs, isEditingFaqPanel]);

  const isLoading = loading || searchLoading;
  const currentError = searchTerm ? searchError : error;

  // Show search if there are more than 5 FAQs or in preview mode with dummy FAQs
  const showSearch = totalFaqs > 5 || isShowingDummyFaqs;

  // Call hook at top level, not inside JSX
  const faqListTransition = useTransitions({ onTrigger: !isLoading && displayedFaqs.length });

  return (
    <>
      <ChatSubSection isPreview={isShowingDummyFaqs}>
        {faqHeading && (
          <h6 className='wpchat:pb-3 wpchat:text-sm wpchat:font-semibold wpchat:text-widget-text-1'>
            {faqHeading}
          </h6>
        )}
        {showSearch && (
          <div className='wpchat:relative wpchat:mx-auto wpchat:mb-3 wpchat:text-gray-600'>
            <div className='wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:mt-3 wpchat:ms-3'>
              <SvgLoader
                name='search'
                className='wpchat:h-[1em] wpchat:w-[1em] wpchat:stroke-widget-icon-2 wpchat:block'
              />
            </div>
            <input
              className={cn(
                'focus:wpchat:outline-none wpchat:h-10 wpchat:w-full wpchat:rounded-sm wpchat:bg-widget-bg-1 wpchat:ps-9 wpchat:text-sm wpchat:text-widget-text wpchat:placeholder-widget-text',
                searchBorder ? 'wpchat:border wpchat:border-widget-border' : 'wpchat:border-0',
              )}
              type='search'
              name='search'
              placeholder={__('Search Questions', 'smashballoon-wpchat-livechat-customer-support')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <p className='wpchat:py-7 wpchat:text-center wpchat:text-sm wpchat:text-widget-text-1'>
            {__('Searching...', 'smashballoon-wpchat-livechat-customer-support')}
          </p>
        )}

        {/* Error Message */}
        {currentError && (
          <p className='wpchat:py-7 wpchat:text-center wpchat:text-sm wpchat:text-widget-text-1'>
            {currentError}
          </p>
        )}

        {/* FAQ List */}
        {!isLoading && !currentError && displayedFaqs.length > 0 && (
          <motion.div {...faqListTransition}>
            <ul>
              {displayedFaqs.map((faq, index) => {
                const userMsg = {
                  message: faq.question,
                  messageType: 'send',
                  directAnswer: true,
                };

                const botMsg = {
                  message: faq.answer,
                  messageType: 'receive',
                  verifiedQuote: true,
                };

                if (faq.image) {
                  botMsg.images = [faq.image];
                }

                const isTracking = isTrackingClick();

                return (
                  <li
                    key={faq.id}
                    className={cn(
                      'wpchat:relative wpchat:w-full wpchat:cursor-pointer wpchat:py-3 wpchat:ps-6 wpchat:text-start wpchat:text-sm wpchat:text-widget-text-1',
                      index !== displayedFaqs.length - 1 && 'wpchat:border-b-1 wpchat:border-widget-border',
                      'wpchat:font-cn wpchat:leading-relaxed' // CN support
                    )}
                    onClick={() => !isTracking && handleFaqClick(faq, userMsg, botMsg)}
                  >
                    <SvgLoader
                      name='chevronRight'
                      className='wpchat:absolute wpchat:start-0 wpchat:fill-widget-icon-3 wpchat:object-center wpchat:rtl:rotate-180'
                    />
                    {faq.question}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {/* No Results Found */}
        {!isLoading && !currentError && displayedFaqs.length === 0 && searchTerm && (
          <p className='wpchat:py-7 wpchat:text-center wpchat:text-sm wpchat:text-widget-text-1'>
            {__(
              'We couldn\'t find any answer matching that result. Please try another keyword.',
              'smashballoon-wpchat-livechat-customer-support',
            )}
          </p>
        )}
      </ChatSubSection>
    </>
  );
}
