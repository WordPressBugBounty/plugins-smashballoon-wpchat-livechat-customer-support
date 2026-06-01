import React from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { logBackNavigation } from '@FDataStore/Chat/analyticsApi';

/**
 * ChatHeader component represents the header section of the chat interface.
 *
 * @component
 * @returns {JSX.Element} The rendered ChatHeader component.
 */
function ChatHeader() {
  const navigate = useNavigate();
  const disableNavigation = useChatStore((s) => s.disableNavigation);

  return (
    <div className='wpchat:flex wpchat:items-center wpchat:rounded-ss-[var(--wpchat-widget-border-radius)] wpchat:rounded-se-[var(--wpchat-widget-border-radius)] wpchat:bg-widget-bg-2 wpchat:py-5 wpchat:min-h-[66px]'>
      {!disableNavigation && (
        <button
          aria-label={__('Go back to home', 'smashballoon-wpchat-livechat-customer-support')}
          onClick={() => {
            // Log enhanced back navigation event
            logBackNavigation('chat', 'home');
            navigate('/');
          }}
        >
          <SvgLoader
            name='chevronLeft'
            className='wpchat:ms-[15px] wpchat:h-[1.6em] wpchat:w-[1.6em] wpchat:cursor-pointer wpchat:fill-widget-alt-accent wpchat:rtl:rotate-180'
          />
        </button>
      )}
    </div>
  );
}

export default ChatHeader;
