import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * ChatNewMessagesSeparator displays a "New Messages" separator with dashed lines.
 * Used to visually separate old conversation history from new messages.
 *
 * @component
 * @returns {JSX.Element} The rendered separator component.
 */
export default function ChatNewMessagesSeparator() {
	return (
		<div className='wpchat:flex wpchat:items-center wpchat:py-3'>
			<div className='wpchat:flex-1 wpchat:border-t wpchat:border-dashed wpchat:border-widget-border-1' />
			<span className='wpchat:px-3 wpchat:text-sm wpchat:text-widget-text-3 wpchat:font-semibold'>
				{__('New Messages', 'smashballoon-wpchat-livechat-customer-support')}
			</span>
			<div className='wpchat:flex-1 wpchat:border-t wpchat:border-dashed wpchat:border-widget-border-1' />
		</div>
	);
}
