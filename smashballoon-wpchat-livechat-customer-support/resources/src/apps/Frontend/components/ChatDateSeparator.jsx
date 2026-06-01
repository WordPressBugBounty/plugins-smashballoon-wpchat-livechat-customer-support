import React from 'react';

/**
 * ChatDateSeparator displays a date separator with the date centered between lines.
 * Used to show the date of old conversation history.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.displayDate - Formatted date string to display (e.g., "Mon, 4 Dec").
 * @returns {JSX.Element} The rendered date separator component.
 */
export default function ChatDateSeparator({ displayDate }) {
	if (!displayDate) return null;

	return (
		<div className='wpchat:flex wpchat:items-center wpchat:py-2'>
			<div className='wpchat:flex-1 wpchat:border-t wpchat:border-widget-border-1 wpchat:border-dashed' />
			<span className='wpchat:px-3 wpchat:text-sm wpchat:text-widget-text-3 wpchat:font-semibold'>{displayDate}</span>
			<div className='wpchat:flex-1 wpchat:border-t wpchat:border-widget-border-1 wpchat:border-dashed' />
		</div>
	);
}
