import React from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import CTA from '@AC/Customizer/CTA';
import SubHeading from '@AC/Customizer/SubHeading';
import Separator from '@AC/Separator';
import { Switch } from '@AC/ui/Switch';
import { TextField } from '@AC/ui/TextField';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import useFaqsStore from '@DataStore/faqs/faqsStore';

/**
 * FAQPanel component displays a list of frequently asked questions and their answers.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered FAQPanel component.
 */
export default function FAQPanel() {
  const navigate = useNavigate();
  const faqHeading = useChatStore((s) => s.faqHeading);
  const setFaqHeading = useChatStore((s) => s.setFaqHeading);
  const visibleMap = useChatStore((s) => s.visibleMap);
  const toggleVisibleKey = useChatStore((s) => s.toggleVisibleKey);
  const totalFaqs = useFaqsStore((s) => s.pagination.totalFaqs);

  const hasNoFaqs = totalFaqs === 0;

  return (
    <>
      <Switch
        className='wpchat:pt-3'
        isSelected={hasNoFaqs ? false : visibleMap?.frequentQuestions}
        onChange={() => toggleVisibleKey('frequentQuestions')}
        iconName="displayEyeOff"
        iconNameOn="displayEye" 
        isDisabled={hasNoFaqs}
        tooltip={hasNoFaqs ? __('This section can be enabled once you add your first question.', 'smashballoon-wpchat-livechat-customer-support') : undefined}
      >
        <div>
          <h3 className='wpchat:text-gray-900 wpchat:m-0 wpchat:text-sm wpchat:font-semibold'>
            {__('Visibility', 'smashballoon-wpchat-livechat-customer-support')}
          </h3>
          <p className='wpchat:text-gray-700 wpchat:my-0 wpchat:text-xs wpchat:leading-relaxed'>
            {hasNoFaqs
              ? __('Add FAQs to enable this section', 'smashballoon-wpchat-livechat-customer-support')
              : __('Let visitors see this section', 'smashballoon-wpchat-livechat-customer-support')
            }
          </p>
        </div>
      </Switch>
      <Separator className='wpchat:-mx-5 wpchat:mt-3 wpchat:mb-0' />
      <SubHeading title={__('Text', 'smashballoon-wpchat-livechat-customer-support')} />
      <TextField
        label={__('Heading', 'smashballoon-wpchat-livechat-customer-support')}
        placeholder={__('Frequently Asked Questions', 'smashballoon-wpchat-livechat-customer-support')}
        name='heading'
        type='text'
        onChange={(value) => setFaqHeading(value)}
        value={faqHeading}
        as='input'
        layout='horizontal'
        variant='one'
        className='wpchat:mb-2'
      />
      <Separator className='wpchat:mt-6 wpchat:mb-3' variant='fullWidth' />
      <CTA
        title={__('Looking to edit Frequent Questions?', 'smashballoon-wpchat-livechat-customer-support')}
        description={__(
          'You can edit these questions from the Frequent Questions page.',
          'smashballoon-wpchat-livechat-customer-support',
        )}
        icon='edit'
        variation='one'
        onClick={() => navigate('/faqs')}
        buttonText={__('Go to Frequent Questions', 'smashballoon-wpchat-livechat-customer-support')}
      />
    </>
  );
}
