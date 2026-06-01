import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import SubHeading from '@AC/Customizer/SubHeading';
import { TextField } from '@AC/ui/TextField';
import { useChatStore } from '@FDataStore/Chat/chatStore';

/**
 * TalkToAiPanel component.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered TalkToAiPanel component.
 */
export default function TalkToAiPanel() {
  const chatbotName = useChatStore((s) => s.chatbotName);
  const [heading, setHeading] = useState(`Talk to ${chatbotName}`);
  const [subHeading, setSubHeading] = useState('Let our helpful bot answer your question');

  return (
    <>
      <SubHeading title={__('Text', 'smashballoon-wpchat-livechat-customer-support')} />
      <TextField
        label={__('Heading', 'smashballoon-wpchat-livechat-customer-support')}
        placeholder={__('Send us a message', 'smashballoon-wpchat-livechat-customer-support')}
        name='heading'
        type='text'
        onChange={setHeading}
        value={heading}
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
        onChange={setSubHeading}
        value={subHeading}
        as='input'
        layout='horizontal'
        variant='secondary'
        className='wpchat:mb-11'
      />
    </>
  );
}
