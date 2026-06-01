import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import GettingStartedSkeleton from '@AC/Dashboard/GettingStartedSkeleton';
import IframeEmbed from '@AC/IframeEmbed';
import Separator from '@AC/Separator';
import TextImage from '@AC/TextImage';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { getImagePath } from '@Utils/getImagePath';

const PageLayout = lazy(() => import('@AC/PageLayout'));

/**
 * GettingStarted component provides introductory content or setup instructions
 * to help users begin using the application effectively.
 *
 * @component
 * @returns {JSX.Element} The rendered GettingStarted component.
 */
function GettingStarted() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<GettingStartedSkeleton />}>
      <PageLayout
        breadcrumb={[{ label: __('Getting Started', 'smashballoon-wpchat-livechat-customer-support') }]}
        className='wpchat:md:pb-32'
      >
        <div className='wpchat:mx-auto wpchat:mb-13 wpchat:max-w-[360px] wpchat:text-center'>
          <h1 className='wpchat:mx-auto wpchat:mt-0 wpchat:mb-2.5 wpchat:max-w-[290px] wpchat:text-2xl wpchat:font-semibold wpchat:text-gray-900'>
            {__(
              'Say hello to your new Chat Support Assistant',
              'smashballoon-wpchat-livechat-customer-support',
            )}
          </h1>
          <p className='wpchat:mt-0 wpchat:mb-8 wpchat:text-xs wpchat:text-gray-500'>
            {__(
              'WPChat helps you connect with your website visitors instantly through live chat messaging. Set up your chat widget in minutes and never miss a customer inquiry.',
              'smashballoon-wpchat-livechat-customer-support',
            )}
          </p>
          <Button
            className='wpchat:mx-auto wpchat:w-full wpchat:max-w-[327px] wpchat:justify-center wpchat:text-center'
            variant='primary'
            onPress={() => {
              // Clear onboarding local storage to start fresh
              try {
                localStorage.removeItem('wpchat_onboarding_state');
              } catch (error) {
                console.warn('Failed to clear onboarding state from localStorage:', error);
              }
              navigate('/getting-started');
            }}
          >
            {__('Set Up', 'smashballoon-wpchat-livechat-customer-support')}
            <SvgLoader name='chevronRight' className='wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:rtl:rotate-180' />
          </Button>
        </div>
        <div className='wpchat:relative wpchat:mx-auto wpchat:mb-15 wpchat:max-w-[565px] wpchat:md:mb-15'>
          <div className='wpchat:absolute wpchat:top-[-30px] wpchat:right-[-90px] wpchat:hidden wpchat:md:block'>
            <SvgLoader name='seeHowItWorks' />
          </div>
          <IframeEmbed
            className='wpchat:pb-[50.80%]'
            imageSrc={getImagePath('onboarding-video-thumbnail.png')}
            iframeSrc='https://www.youtube.com/embed/AxvPJZVI33I?autoplay=1'
          />
        </div>
        <Separator className='wpchat:mb-9 wpchat:border-dashed wpchat:border-gray-300' />
        <h2 className='wpchat:mt-0 wpchat:mb-3 wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900'>
          {__('Getting started is easy', 'smashballoon-wpchat-livechat-customer-support')}
        </h2>
        <TextImage
          number={__('1', 'smashballoon-wpchat-livechat-customer-support')}
          title={__('Add your WhatsApp Number', 'smashballoon-wpchat-livechat-customer-support')}
          description={__(
            'Add a WhatsApp number you would like to forward your customers to. We also support Telegram, Instagram, and more.',
            'smashballoon-wpchat-livechat-customer-support',
          )}
          imageName='asset-1.png'
          altText={__('WhatsApp', 'smashballoon-wpchat-livechat-customer-support')}
        />
        <TextImage
          number={__('2', 'smashballoon-wpchat-livechat-customer-support')}
          title={__('Select a theme ', 'smashballoon-wpchat-livechat-customer-support')}
          description={__(
            'Select a theme that compliments your own brand.',
            'smashballoon-wpchat-livechat-customer-support',
          )}
          imageName='asset-2.png'
          altText={__('WhatsApp', 'smashballoon-wpchat-livechat-customer-support')}
        />
        <TextImage
          number={__('3', 'smashballoon-wpchat-livechat-customer-support')}
          title={__('Embed it on your website', 'smashballoon-wpchat-livechat-customer-support')}
          description={__(
            'That\’s it! You can embed it on your website and it\’ll show up on the right corner.',
            'smashballoon-wpchat-livechat-customer-support',
          )}
          imageName='asset-3.png'
          altText={__('WhatsApp', 'smashballoon-wpchat-livechat-customer-support')}
        />
      </PageLayout>
    </Suspense>
  );
}

export default GettingStarted;
