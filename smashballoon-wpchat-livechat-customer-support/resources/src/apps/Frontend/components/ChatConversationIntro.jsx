import React from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { useChatStore } from '@Frontend/context/ChatStoreContext';

/**
 * ChatConversationIntro displays the intro header for conversation history.
 * Shows the chatbot avatar, name, and a description.
 *
 * @component
 * @returns {JSX.Element} The rendered intro component.
 */
export default function ChatConversationIntro() {
	const chatbotAvatar = useChatStore((s) => s.chatbotAvatar);
	const chatbotName = useChatStore((s) => s.chatbotName);

	const isImage =
		/\.(png|jpe?g|gif|webp|bmp|ico)$/i.test(chatbotAvatar) ||
		/^data:image\/(png|jpe?g|gif|webp|bmp|ico);base64,/.test(chatbotAvatar);

	return (
		<div className='wpchat:flex wpchat:flex-col wpchat:items-center wpchat:pt-4 wpchat:pb-5 wpchat:max-w-[210px] wpchat:w-full wpchat:text-center wpchat:mx-auto'>
			<div className='wpchat:mb-5.5'>
				{isImage ? (
					<img
						src={chatbotAvatar}
						alt={__('Chatbot Avatar', 'smashballoon-wpchat-livechat-customer-support')}
						className='wpchat:h-17 wpchat:w-17 wpchat:rounded-full wpchat:object-cover'
					/>
				) : (
					<SvgLoader name={chatbotAvatar} className='wpchat:h-17 wpchat:w-17' />
				)}
			</div>
			<h5 className='wpchat:text-base wpchat:font-semibold wpchat:text-widget-text-3 wpchat:mb-0.5'>
				{chatbotName}
			</h5>
			<span className='wpchat:text-sm wpchat:text-widget-text-3'>
				{__('This is the start of your conversation with', 'smashballoon-wpchat-livechat-customer-support')}{' '}
				{chatbotName}
			</span>
		</div>
	);
}
