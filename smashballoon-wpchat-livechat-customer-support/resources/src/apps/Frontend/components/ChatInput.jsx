import React from 'react';
import SvgLoader from '@Components/SvgLoader';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { cn } from '@Utils/cn';

const chatInputVariations = {
  primary: {
    input:
      'wpchat:h-[50px] wpchat:w-full wpchat:rounded-xl wpchat:border wpchat:border-solid wpchat:border-widget-border-1 wpchat:pe-12 wpchat:ps-5',
    button:
      'wpchat:absolute wpchat:top-1/2 wpchat:end-[20px] wpchat:w-[1.3em] wpchat:h-[1.3em] wpchat:-translate-y-1/2 ',
    icon: 'wpchat:stroke-widget-accent-2',
  },
  secondary: {
    input:
      'wpchat:h-[60px] wpchat:rounded-[56px] wpchat:border-none wpchat:ps-5 wpchat:pe-12 wpchat:w-[calc(100%-68px)]',
    button: 'wpchat:absolute wpchat:end-0 wpchat:w-[3.7em] wpchat:h-[3.7em]',
    icon: 'wpchat:fill-widget-accent-2',
  },
  tertiary: {
    input:
      'wpchat:h-[50px] wpchat:w-full wpchat:rounded-xl wpchat:border wpchat:border-solid wpchat:border-widget-border-1 wpchat:pe-12 wpchat:ps-5',
    button:
      'wpchat:absolute wpchat:top-1/2 wpchat:end-[15px] wpchat:h-[20px] wpchat:w-[20px] wpchat:-translate-y-1/2 wpchat:w-[1.7em] wpchat:h-[1.7em] ',
    icon: 'wpchat:fill-widget-accent-2',
  },
};

/**
 * ChatInput component renders a text input for typing chat messages with handlers for input and sending.
 *
 * @param {Object} props - Component props.
 * @param {string} [props.inputPlaceholder=''] - Placeholder text for the input field.
 * @param {string} props.message - Current message value in the input.
 * @param {function(Event): void} props.handleChange - Callback fired on input value change.
 * @param {function(KeyboardEvent): void} props.handleKeyDown - Callback fired on key press within the input.
 * @param {function(): void} props.handleSendMessage - Callback fired when sending the message.
 *
 * @returns {JSX.Element} The rendered ChatInput component.
 */
const ChatInput = ({
  inputPlaceholder = '',
  message,
  handleChange,
  handleKeyDown,
  handleSendMessage,
}) => {
  // Zustand store values
  const chatInputVariation = useChatStore((s) => s.chatInputVariation);
  const chatInputSendIcon = useChatStore((s) => s.chatInputSendIcon);

  const variation = chatInputVariations[chatInputVariation] || chatInputVariations.primary;

  return (
    <div className='wpchat:relative'>
      <input
        className={cn(
          'wpchat:bg-widget-send-input-bg wpchat:text-base wpchat:font-medium wpchat:text-widget-send-input-text wpchat:placeholder:text-widget-send-input-placeholder',
          variation.input,
        )}
        type='text'
        name='text'
        placeholder={inputPlaceholder}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleSendMessage} className={cn('wpchat:cursor-pointer', variation.button)}>
        <SvgLoader
          name={chatInputSendIcon ? chatInputSendIcon : 'send'}
          className={cn('wpchat:h-full wpchat:w-full', variation.icon)}
        />
      </button>
    </div>
  );
};

export default ChatInput;
