import React from 'react';
import { __ } from '@wordpress/i18n';
import { Checkbox } from '@AC/ui/Checkbox';

export default function DataSharingSection({
  dataSharingConsent,
  onConsentChange,
  title = __('Help improve WPChat', 'smashballoon-wpchat-livechat-customer-support'),
  description = __('Share anonymised usage data with WPChat and Smash Balloon to help improve our products. This also enables in-plugin notifications for updates, fixes, and new features.', 'smashballoon-wpchat-livechat-customer-support'),
}) {
  return (
    <div className='wpchat:rounded-lg wpchat:shadow wpchat:border wpchat:border-gray-200 wpchat:md:py-6 wpchat:md:px-11 wpchat:p-5 wpchat:bg-[linear-gradient(180deg,#F1FBFF_0%,#FFFFFF_41.61%)]'>
      <div className='wpchat:flex wpchat:items-start wpchat:gap-5'>
        <Checkbox
          isSelected={dataSharingConsent}
          onChange={onConsentChange}
          variant="solid"
          className='wpchat:mt-1'
        />
        <div className='wpchat:flex-1 wpchat:max-w-[450px]'>
          <h5 className='wpchat:text-gray-900 wpchat:text-base wpchat:font-semibold wpchat:m-0'>
            {title}
          </h5>
          <p className='wpchat:m-0 wpchat:mt-1 wpchat:text-sm wpchat:text-gray-700 wpchat:mb-4'>
            {description}
          </p>
          <div className='wpchat:flex wpchat:gap-4 wpchat:text-xs wpchat:text-wp-blue-500'>
            <a href={window.wpChatAdmin?.urls?.onboardingConsentLinks?.permissions} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
              {__('What permissions are being granted?', 'smashballoon-wpchat-livechat-customer-support')}
            </a>
            <a href={window.wpChatAdmin?.urls?.onboardingConsentLinks?.terms} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
              {__('Terms & Conditions', 'smashballoon-wpchat-livechat-customer-support')}
            </a>
            <a href={window.wpChatAdmin?.urls?.onboardingConsentLinks?.privacy} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
              {__('Privacy', 'smashballoon-wpchat-livechat-customer-support')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
