import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import SubHeading from '@AC/Customizer/SubHeading';
import Separator from '@AC/Separator';
import { Switch } from '@AC/ui/Switch';
import { TextField } from '@AC/ui/TextField';
import { useChatStore } from '@FDataStore/Chat/chatStore';

/**
 * SendMessage component.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered SendMessage component.
 */
export default function SendMessage() {
  const sendMessageIcon = useChatStore((s) => s.sendMessageIcon);
  const setSendMessageIcon = useChatStore((s) => s.setSendMessageIcon);

  const sendMessageHeading = useChatStore((s) => s.sendMessageHeading);
  const setSendMessageHeading = useChatStore((s) => s.setSendMessageHeading);

  const sendMessageSubHeading = useChatStore((s) => s.sendMessageSubHeading);
  const setSendMessageSubHeading = useChatStore((s) => s.setSendMessageSubHeading);

  const visibleMap = useChatStore((s) => s.visibleMap);
  const toggleVisibleKey = useChatStore((s) => s.toggleVisibleKey);

  return (
    <>
      <Switch
        className='wpchat:pt-3'
        isSelected={visibleMap?.sendMessage}
        onChange={() => toggleVisibleKey('sendMessage')}
        iconName="displayEyeOff"
        iconNameOn="displayEye" 
      >
        <div>
          <h3 className='wpchat:text-gray-900 wpchat:m-0 wpchat:text-sm wpchat:font-semibold'>
            {__('Visibility', 'smashballoon-wpchat-livechat-customer-support')}
          </h3>
          <p className='wpchat:text-gray-700 wpchat:my-0 wpchat:text-xs wpchat:leading-relaxed'>
            {__('Let visitors see this section', 'smashballoon-wpchat-livechat-customer-support')}
          </p>
        </div>
      </Switch>
      <Separator className='wpchat:-mx-5 wpchat:mt-3 wpchat:mb-0' />
      <Switch
        className='wpchat:pt-3'
        isSelected={sendMessageIcon}
        onChange={(value) => setSendMessageIcon(value)}
        align="right"
        iconName="photo"
      >
        <div>
          <h3 className='wpchat:text-gray-900 wpchat:m-0 wpchat:text-sm wpchat:font-semibold'>
            {__('Icons', 'smashballoon-wpchat-livechat-customer-support')}
          </h3>
          <p className='wpchat:text-gray-700 wpchat:my-0 wpchat:text-xs wpchat:leading-relaxed'>
            {__('Display icons of platforms users can get in touch with', 'smashballoon-wpchat-livechat-customer-support')}
          </p>
        </div>
      </Switch>
      <Separator className='wpchat:-mx-5 wpchat:mt-3 wpchat:mb-0' />
      <SubHeading title={__('Text', 'smashballoon-wpchat-livechat-customer-support')} />
      <TextField
        label={__('Heading', 'smashballoon-wpchat-livechat-customer-support')}
        placeholder={__('Send us a message', 'smashballoon-wpchat-livechat-customer-support')}
        name='heading'
        type='text'
        onChange={(value) => setSendMessageHeading(value)}
        value={sendMessageHeading}
        as='input' 
        layout='horizontal'
        variant='secondary'
        className='wpchat:mb-2'
      />
      <TextField
        label={__('SubHeading', 'smashballoon-wpchat-livechat-customer-support')}
        placeholder={__('How can we help you?', 'smashballoon-wpchat-livechat-customer-support')}
        name='Subheading'
        type='text'
        onChange={(value) => setSendMessageSubHeading(value)}
        value={sendMessageSubHeading}
        as='input'
        layout='horizontal'
        variant='secondary'
        className='wpchat:mb-2'
      />
    </>
  );
}
