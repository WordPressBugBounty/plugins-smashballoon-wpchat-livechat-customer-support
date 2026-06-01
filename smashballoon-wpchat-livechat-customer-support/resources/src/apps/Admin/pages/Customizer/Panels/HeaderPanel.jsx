import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import SubHeading from '@AC/Customizer/SubHeading';
import { TextField } from '@AC/ui/TextField';
import { useChatStore } from '@FDataStore/Chat/chatStore';

/**
 * HeaderPanel component renders the header section of a panel or page.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered HeaderPanel component.
 */
export default function HeaderPanel() {
  const headerHeading = useChatStore((s) => s.headerHeading);
  const setHeaderHeading = useChatStore((s) => s.setHeaderHeading);

  return (
    <>
      <SubHeading title={__('Text', 'smashballoon-wpchat-livechat-customer-support')} />
      <TextField
        label={__('Heading', 'smashballoon-wpchat-livechat-customer-support')}
        placeholder={__('How can we help you?', 'smashballoon-wpchat-livechat-customer-support')}
        name='heading'
        type='text'
        onChange={(value) => setHeaderHeading(value)}
        value={headerHeading}
        as='input'
        layout='horizontal'
        variant='secondary'
        className='wpchat:mb-2'
      />
    </>
  );
}
