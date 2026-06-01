import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';
import { cn } from '@Utils/cn';

/**
 * Button configuration for UpgradeToProNotice.
 * @typedef {Object} ButtonConfig
 * @property {string} [label] - Optional button text
 * @property {string} link - The URL to navigate to when clicked
 */

/**
 * Props for UpgradeToProNotice component.
 * @typedef {Object} UpgradeToProNoticeProps
 * @property {React.ReactNode} [icon] - Optional icon element to display
 * @property {string} title - Main title text
 * @property {string} description - Description text
 * @property {ButtonConfig} [btn1] - Primary button configuration
 * @property {ButtonConfig} [btn2] - Secondary button configuration
 * @property {string} [className] - Additional Tailwind classes to merge
 */

/**
 * Displays a notice prompting the user to upgrade to Pro.
 * Supports optional icon, title, description, and up to two buttons.
 *
 * @param {UpgradeToProNoticeProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <UpgradeToProNotice
 *   icon={<MyIcon />}
 *   title="Upgrade to Pro"
 *   description="Get access to all features."
 *   btn1={{ link: '/upgrade' }}
 *   btn2={{ link: '/learn-more', label: 'Learn More' }}
 * />
 */
export default function UpgradeToProNotice({ icon, title, description, btn1, btn2, className }) {
  return (
    <div
      className={cn(
        'wpchat:relative wpchat:rounded-lg wpchat:border-t-2 wpchat:border-green-600 wpchat:bg-gradient-to-b wpchat:from-[#F6FFFC] wpchat:to-[#FFFFFF] wpchat:pt-7 wpchat:pe-11 wpchat:pb-9.5 wpchat:ps-27',
        className,
      )}
    >
      {icon && (
        <div className='wpchat:absolute wpchat:top-7 wpchat:start-9 wpchat:rounded-full wpchat:bg-white wpchat:p-2.5 wpchat:shadow-md'>
          {icon}
        </div>
      )}

      <div className='wpchat:flex wpchat:items-center wpchat:gap-3'>
        <TitleDescription
          title={title}
          description={description}
          descriptionClassName='wpchat:mb-0'
          titleClassName='wpchat:mb-1'
          className='wpchat:mb-7 wpchat:w-full wpchat:max-w-[324px]'
        />
      </div>

      {(btn1?.link || btn2?.link) && (
        <div className='wpchat:flex wpchat:gap-2'>
          {btn1?.link && (
            <Button
              onClick={() => (window.location.href = btn1.link)}
              className='wpchat:px-2 wpchat:py-1.5 wpchat:text-xs'
              variant='tertiary'
            >
              {btn1.label || __('Upgrade', 'smashballoon-wpchat-livechat-customer-support')}
              <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
            </Button>
          )}
          {btn2?.link && (
            <Button
              onClick={() => (window.location.href = btn2.link)}
              variant='secondary'
              className='wpchat:px-2 wpchat:py-1.5 wpchat:text-xs'
            >
              {btn2.label || __('Learn More', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
