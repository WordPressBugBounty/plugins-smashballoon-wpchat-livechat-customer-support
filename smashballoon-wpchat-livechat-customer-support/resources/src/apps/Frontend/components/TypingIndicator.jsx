import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * TypingIndicator component displays an animation to indicate that the agent is typing.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.agentName - The name of the agent who is typing.
 *
 * @returns {JSX.Element} The rendered TypingIndicator component.
 */
export default function TypingIndicator({ agentName }) {
  return (
    <div className='wpchat:text-sm wpchat:text-widget-text-1 wpchat:italic'>{`${agentName} ${__(' is typing...', 'smashballoon-wpchat-livechat-customer-support')}`}</div>
  );
}
