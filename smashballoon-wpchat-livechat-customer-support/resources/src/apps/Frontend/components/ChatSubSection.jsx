import React from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

/**
 * ChatSubSection component represents a subsection within the chat interface.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the subsection.
 * @param {Function} [props.onClick] - Optional click handler function.
 * @param {string} [props.className] - Optional additional CSS classes.
 * @param {boolean} [props.isPreview] - Show preview banner indicating not visible on live site.
 *
 * @returns {JSX.Element} The rendered ChatSubSection component.
 */
export default function ChatSubSection({ children, onClick, className, isPreview }) {
  return (
    <div
      className={cn(
        'wpchat:relative wpchat:mb-3 wpchat:cursor-pointer wpchat:rounded-lg wpchat:bg-widget-card-bg wpchat:text-start wpchat:shadow-md',
        isPreview ? 'wpchat:border-wp-blue-500 wpchat:border-2 wpchat:pt-0 wpchat:overflow-hidden' : 'wpchat:p-5 wpchat:pe-5',
        className
      )}
      onClick={onClick}
      {...(onClick && { role: 'button', tabIndex: 0 })}
    >
      {isPreview && (
        <div
          role="status"
          aria-live="polite"
          className="wpchat:flex wpchat:items-center wpchat:justify-center wpchat:gap-2 wpchat:bg-wp-blue-500 wpchat:py-1.5 wpchat:text-xs wpchat:text-white"
        >
          <SvgLoader name="displayEye" className="wpchat:h-3 wpchat:w-3 wpchat:fill-white" aria-hidden="true" />
          <span className="wpchat:font-semibold">{__('Preview', 'smashballoon-wpchat-livechat-customer-support')}</span>
          <span>{__('Not visible on live site', 'smashballoon-wpchat-livechat-customer-support')}</span>
        </div>
      )}
      <div className={isPreview ? 'wpchat:p-5 wpchat:bg-widget-card-bg wpchat:border wpchat:border-wp-light-blue-500 wpchat:rounded-lg wpchat:rounded-tl-none wpchat:rounded-tr-none' : ''}>
        {children}
      </div>
    </div>
  );
}
