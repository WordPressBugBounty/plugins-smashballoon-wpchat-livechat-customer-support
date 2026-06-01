import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { getImagePath } from '@Utils/getImagePath';

function NeedHelp({ className }) {
  return (
    <div
      className={cn( 
        'wpchat:flex wpchat:flex-wrap wpchat:rounded-xs wpchat:bg-white wpchat:px-5 wpchat:pt-5 wpchat:pb-6 wpchat:shadow-md',
        className,
      )}
    >
      <div className='wpchat:relative wpchat:mb-4 wpchat:md:w-[72%] wpchat:md:pe-3 wpchat:md:ps-25'>
        <div className='wpchat:bg-wp-blue-50 wpchat:flex wpchat:h-17 wpchat:w-17 wpchat:items-center wpchat:justify-center wpchat:rounded-full wpchat:md:absolute wpchat:md:top-0 wpchat:md:start-0'>
          <SvgLoader name='forum' className='wpchat:fill-wp-blue-500 wpchat:h-7 wpchat:w-7' />
        </div>
        <h3 className='wpchat:text-gray-900 wpchat:mt-0 wpchat:mb-4 wpchat:text-2xl wpchat:leading-relaxed wpchat:font-semibold'>
          {__('Need more support? We’re here to help.', 'smashballoon-wpchat-livechat-customer-support')}
        </h3>
        <Button
          variant='primary'
          onPress={() =>
            window.open(window.wpChatAdmin?.urls?.support || 'https://smashballoon.com/support/', '_blank', 'noopener,noreferrer')
          }
        >
          {__('Create a Support Ticket', 'smashballoon-wpchat-livechat-customer-support')}
          <SvgLoader name='chevronRight' className='wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:rtl:rotate-180' />
        </Button>
      </div>
      <div className='wpchat:md:border-gray-200 wpchat:md:w-[28%] wpchat:md:border-s wpchat:md:ps-8'>
        <img
          src={getImagePath('user-photos-support.png')}
          alt='asdsad'
          className='wpchat:mb-3 wpchat:max-w-33'
        />
        <p className='wpchat:text-gray-900 wpchat:text-sm wpchat:leading-relaxed'>
          {__('Our fast and friendly support team is always happy to help!', 'smashballoon-wpchat-livechat-customer-support')}
        </p>
      </div>
    </div>
  );
}

export default NeedHelp;
