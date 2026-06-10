import React from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import PlatformLinks from '@FC/PlatformLinks';
import QRCodeMessage from '@FC/QRCodeMessage';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { getCurrentTime } from '@Utils/getCurrentTime';

/**
 * ChatBubble component represents an individual chat message bubble.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Object} props.msg - The message object containing text, images, options, etc.
 * @param {Function} props.setChatMessages - Function to update the chat messages state.
 * @returns {JSX.Element|null} Rendered chat bubble, or null if no message.
 */
function ChatBubble({ msg, setChatMessages }) {
  const chatbotAvatar = useChatStore((s) => s.chatbotAvatar);
  const chatbotName = useChatStore((s) => s.chatbotName);

  if (!msg) return null;

  // Ensure showMsgOption is always defined
  const { message, optionsList, messageType, images, verifiedQuote, displayTime: storedDisplayTime, type, data } = msg;
  const showOptions = msg.showMsgOption ?? true;

  const name = messageType === 'receive' ? chatbotName : __('You', 'smashballoon-wpchat-livechat-customer-support');

  // Use stored displayTime if available, otherwise fall back to current time
  const displayTime = storedDisplayTime || getCurrentTime();

  // Determine the message content based on type
  let messageContent = message;

  if (type === 'qr_code' && data) {
    messageContent = <QRCodeMessage {...data} />;
  }

  const isImage =
    /\.(png|jpe?g|gif|webp|bmp|ico)$/i.test(chatbotAvatar) ||
    /^data:image\/(png|jpe?g|gif|webp|bmp|ico);base64,/.test(chatbotAvatar);

  const handleClick = ({ label, onClick }) => {
    if (!setChatMessages || !onClick) return;

    // Add user's message
    const userMsg = { message: label, messageType: 'send', optionsList: null };
    setChatMessages((prev) => [...prev, userMsg]);

    // Hide options for THIS message
    setChatMessages((prev) => prev.map((m) => (m === msg ? { ...m, showMsgOption: false } : m)));

    // Add bot response after delay
    setTimeout(() => {
      const newMsg = onClick();
      if (newMsg) {
        setChatMessages((prev) => [
          ...prev,
          { ...newMsg, showMsgOption: true }, // initialize options for new message
        ]);
      }
    }, 500);
  };

  return (
    <div className='wpchat:relative wpchat:min-h-[48px] wpchat:w-full wpchat:pe-3 wpchat:pb-5 wpchat:ps-[60px]'>
      <div className='wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:h-[48px] wpchat:w-[48px]'>
        {messageType === 'receive' &&
          (isImage ? (
            <img
              src={chatbotAvatar}
              alt={__('Chatbot Avatar', 'smashballoon-wpchat-livechat-customer-support')}
              className='wpchat:h-[48px] wpchat:w-[48px] wpchat:rounded-full wpchat:object-cover'
            />
          ) : (
            <SvgLoader name={chatbotAvatar} />
          ))}
      </div>

      <div className='wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:ps-3'>
        {name && (
          <span className='wpchat:text-sm wpchat:font-semibold wpchat:text-widget-bubble-username'>
            {name}
          </span>
        )}
        {displayTime && (
          <span className='wpchat:text-1 wpchat:text-sm wpchat:text-widget-bubble-time'>
            {displayTime}
          </span>
        )}
      </div>

      {(message || type) && (
        <div
          className={`wpchat:rounded-2xl wpchat:px-3 wpchat:py-2 wpchat:text-base wpchat:break-words wpchat:whitespace-pre-line ${
            messageType === 'receive'
              ? 'wpchat:bg-widget-receive-bg wpchat:text-widget-receive-text'
              : 'wpchat:bg-widget-send-bg wpchat:text-widget-send-text'
          }`}
        >
          {messageContent}
          {images?.map(
            (image, index) =>
              image?.trim() && (
                <img
                  key={index}
                  src={image}
                  alt={__('Message image', 'smashballoon-wpchat-livechat-customer-support')}
                  className='wpchat:mt-2 wpchat:rounded-lg'
                />
              ),
          )}
          {verifiedQuote && (
            <div className='wpchat:flex wpchat:justify-end'>
              <span className='wpchat:text-widget-accent-1 wpchat:mt-2 wpchat:flex wpchat:items-center wpchat:justify-center wpchat:rounded-md wpchat:bg-white wpchat:px-2 wpchat:py-1 wpchat:text-xs wpchat:font-semibold'>
                <SvgLoader
                  name='shieldCheck'
                  className='wpchat:me-1 wpchat:h-[1.6em] wpchat:w-[1.6em]'
                />
                {__('Verified quote', 'smashballoon-wpchat-livechat-customer-support')}
              </span>
            </div>
          )}
        </div>
      )}

      {type === 'platform_links' && data && (
        <PlatformLinks platforms={data.platforms} storeApi={msg.storeApi} />
      )}

      {optionsList && messageType === 'receive' && showOptions && (
        <div className='wpchat:pt-4'>
          {optionsList.map(({ label, onClick }, index) =>
            label ? (
              <button
                key={index}
                className='wpchat:me-1 wpchat:mb-1.5 wpchat:cursor-pointer wpchat:rounded-2xl wpchat:border wpchat:border-solid wpchat:bg-transparent wpchat:px-5 wpchat:py-1 wpchat:text-base wpchat:text-widget-accent-1 wpchat:hover:border-transparent wpchat:hover:bg-widget-accent-1 wpchat:hover:text-white'
                onClick={() => handleClick({ label, onClick })}
              >
                {label}
              </button>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ChatBubble);
