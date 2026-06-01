import React from 'react';
import { __ } from '@wordpress/i18n';
import { Checkbox } from '@AC/ui/Checkbox';
import { TextField } from '@AC/ui/TextField';

export default function NewsletterSection({
  newsletterEmail,
  newsletterSubscribed,
  onEmailChange,
  onSubscribedChange,
  title = __('Get members-only discounts and tips right into your inbox', 'smashballoon-wpchat-livechat-customer-support'),
  description = __("We occasionally share exclusive offers and tips to our plugin users. Sign up so you don't miss it!", 'smashballoon-wpchat-livechat-customer-support'),
  placeholder = 'john.doe@something.com'
}) {
  return (
    <div className='wpchat:rounded-lg wpchat:shadow wpchat:border wpchat:border-gray-200 wpchat:md:py-6 wpchat:md:px-11 wpchat:p-5 wpchat:bg-[linear-gradient(180deg,#F1FBFF_0%,#FFFFFF_41.61%)]'>
      <div className='wpchat:flex wpchat:items-start wpchat:gap-5'>
        <Checkbox
          isSelected={newsletterSubscribed}
          onChange={onSubscribedChange}
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

          <div className='wpchat:flex wpchat:max-w-[420px] wpchat:items-center wpchat:gap-2'>
            <TextField
              aria-label={__('Email', 'smashballoon-wpchat-livechat-customer-support')}
              icon='email'
              iconPosition='left'
              className='wpchat:flex-1'
              value={newsletterEmail}
              onChange={onEmailChange}
              placeholder={placeholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}