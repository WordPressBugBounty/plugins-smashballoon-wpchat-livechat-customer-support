import React from 'react';
import { __ } from '@wordpress/i18n';
import { Modal } from '@AC/ui/Modal';
import { Button } from '@AC/ui/Button';
import { Dialog } from 'react-aria-components';
import SvgLoader from '@Components/SvgLoader';

export default function DataSharingConsentModal({ isOpen, onAccept, onSkip }) {
  return (
    <Modal isOpen={isOpen} isDismissable={false}>
      <Dialog className='wpchat:outline-none'>
        <div className='wpchat:relative wpchat:mx-auto wpchat:w-full wpchat:rounded-lg wpchat:bg-white wpchat:shadow-2xl wpchat:md:w-[550px]'>
          {/* Close button */}
          <SvgLoader
            name='close'
            className='wpchat:absolute wpchat:top-3 wpchat:right-3 wpchat:h-5 wpchat:w-5 wpchat:cursor-pointer wpchat:fill-gray-500'
            role='button'
            tabIndex={0}
            aria-label={__('Close', 'smashballoon-wpchat-livechat-customer-support')}
            onClick={onSkip}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSkip();
                e.preventDefault();
              }
            }}
          />

          {/* Body */}
          <div className='wpchat:flex wpchat:items-start wpchat:gap-5 wpchat:pt-8 wpchat:pb-6 wpchat:px-6'>
            {/* Logo */}
            <div className='wpchat:shrink-0'>
              <SvgLoader name='logo' className='wpchat:h-14 wpchat:w-14' />
            </div>

            {/* Content */}
            <div className='wpchat:flex wpchat:flex-col wpchat:gap-8 wpchat:flex-1'>
              <div className='wpchat:flex wpchat:flex-col wpchat:gap-2'>
                <h3 className='wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900 wpchat:m-0'>
                  {__('Welcome to WPChat!', 'smashballoon-wpchat-livechat-customer-support')}
                </h3>
                <div className='wpchat:text-sm wpchat:text-gray-700 wpchat:flex wpchat:flex-col wpchat:gap-3'>
                  <p className='wpchat:m-0'>
                    {__('Help us build the best chat plugin for WordPress. By sharing anonymous usage data, you\'ll help our team prioritize the features that matter most.', 'smashballoon-wpchat-livechat-customer-support')}
                  </p>
                  <p className='wpchat:m-0'>
                    {__('In return, we\'ll keep you in the loop with product updates and helpful tips. You can change your mind anytime in Settings.', 'smashballoon-wpchat-livechat-customer-support')}
                  </p>
                </div>
              </div>

              {/* Links */}
              <div className='wpchat:flex wpchat:gap-4 wpchat:text-xs wpchat:text-wp-blue-500'>
                <a href={window.wpChatAdmin?.urls?.consentModalLinks?.permissions} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                  {__('What permissions are being granted?', 'smashballoon-wpchat-livechat-customer-support')}
                </a>
                <a href={window.wpChatAdmin?.urls?.consentModalLinks?.terms} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                  {__('Terms & Conditions', 'smashballoon-wpchat-livechat-customer-support')}
                </a>
                <a href={window.wpChatAdmin?.urls?.consentModalLinks?.privacy} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                  {__('Privacy', 'smashballoon-wpchat-livechat-customer-support')}
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='wpchat:flex wpchat:justify-end wpchat:gap-2 wpchat:border-t wpchat:border-gray-200 wpchat:px-6 wpchat:py-4'>
            <Button variant='secondary' onPress={onSkip}>
              {__('Skip', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
            <Button onPress={onAccept}>
              <SvgLoader name='check' className='wpchat:h-4 wpchat:w-4' />
              {__('Accept & Continue', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}
