import React from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { Button } from '@AC/ui/Button';
import { getImagePath } from '@Utils/getImagePath';

export default function UpgradePromoSection() {
  return (
    <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-8 wpchat:md:p-2.5 wpchat:p-5 wpchat:md:ps-10 wpchat:md:grid-cols-2 wpchat:justify-center wpchat:items-center'>
      <div>
        <h4 className='wpchat:m-0 wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900 wpchat:leading-[30px]'>
          {__('Upgrade more agents, funnels, themes and more', 'smashballoon-wpchat-livechat-customer-support')}
        </h4>
        <p className='wpchat:m-0 wpchat:mt-2 wpchat:text-sm wpchat:text-gray-500'>
          {__(
            'To unlock these features and much more, upgrade to Pro and enter your license key below.',
            'smashballoon-wpchat-livechat-customer-support',
          )}
        </p>
        <div className='wpchat:mt-4'>
          <Button 
            variant='tertiary' 
            className='wpchat:justify-center wpchat:bg-wp-blue-500 hover:wpchat:bg-wp-light-blue-500 wpchat:text-white wpchat:w-full'
            onClick={() => window.open(window.wpChatAdmin?.upgradeUrl || '#', '_blank')}
          >
            {__('Upgrade to WPChat Pro', 'smashballoon-wpchat-livechat-customer-support')}
            <SvgLoader name='chevronRight' className='wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:rtl:rotate-180' />
          </Button>
        </div>
        <div className='wpchat:mt-3 wpchat:inline-flex wpchat:items-start wpchat:gap-3 wpchat:rounded wpchat:bg-amber-100 wpchat:px-3 wpchat:py-2 wpchat:w-full'>
          <SvgLoader name='tagOutline' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:shrink-0 wpchat:mt-0.5' />
          <p className='wpchat:text-sm wpchat:w-full wpchat:text-amber-950 wpchat:m-0'>
             {__('Upgrade today and ', 'smashballoon-wpchat-livechat-customer-support')}
            <b>{__('save 50% on a Pro License! ', 'smashballoon-wpchat-livechat-customer-support')}</b>
            <span className='wpchat:text-xs'>{__('(auto-applied at checkout)', 'smashballoon-wpchat-livechat-customer-support')}</span>
          </p>
        </div>
      </div>
      <div className='wpchat:relative wpchat:flex wpchat:h-[340px] wpchat:items-end wpchat:justify-center wpchat:bg-wp-blue-500 wpchat:p-3 wpchat:rounded-lg'>
        <img
          src={getImagePath('chatbot-section.png')}
          alt='Chatbot Preview'
          className='wpchat:max-h-full wpchat:object-contain'
        />
        <div className='wpchat:pointer-events-none wpchat:absolute wpchat:bottom-0 wpchat:start-0 wpchat:end-0 wpchat:h-12 wpchat:bg-gradient-to-b wpchat:from-transparent wpchat:to-[var(--wpchat-color-wp-blue-500)] wpchat:blur' />
      </div>
    </div>
  );
}