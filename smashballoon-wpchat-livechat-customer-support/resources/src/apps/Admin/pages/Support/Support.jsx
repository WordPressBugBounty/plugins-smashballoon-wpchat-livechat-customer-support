import React, { Suspense, lazy } from 'react';
import { __ } from '@wordpress/i18n';
import Card from '@AC/Support/Card';
import NeedHelp from '@AC/Support/NeedHelp';
import SystemInfo from '@AC/Support/SystemInfo';
import SupportSkeleton from '@AC/Support/SupportSkeleton';
import { addUtmParams } from '@Utils/utmHelper';

const PageLayout = lazy(() => import('@AC/PageLayout'));

const utmParams = {
  utm_source: 'plugin',
  utm_medium: 'support_page',
  utm_campaign: 'wpchat_docs'
};

const cardData = [
  {
    heading: __('Getting Started', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Some helpful resources to get you started', 'smashballoon-wpchat-livechat-customer-support'),
    icon: 'rocketLaunch',
    linkText: __('More help on Getting started', 'smashballoon-wpchat-livechat-customer-support'),
    linkHref: addUtmParams('https://wpchat.com/help-center/', utmParams),
    articleList: [
      { title: __('How to install the plugin', 'smashballoon-wpchat-livechat-customer-support'), link: addUtmParams('https://wpchat.com/guides/getting-started/getting-started-with-wpchat-installation-and-setup/', utmParams) },
      { title: __('Setting up your first widget', 'smashballoon-wpchat-livechat-customer-support'), link: addUtmParams('https://wpchat.com/guides/getting-started/customizing-your-chat-widget-appearance-behavior/', utmParams) },
      { title: __('Basic configuration options', 'smashballoon-wpchat-livechat-customer-support'), link: addUtmParams('https://wpchat.com/guides/getting-started/setting-up-your-support-agents/', utmParams) },
    ],
  },
  {
    heading: __('Docs & Troubleshooting', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Run into an issue? Check out our help docs.', 'smashballoon-wpchat-livechat-customer-support'),
    icon: 'bookOpenVariant',
    linkText: __('View Documentation', 'smashballoon-wpchat-livechat-customer-support'),
    linkHref: addUtmParams('https://wpchat.com/help-center/', utmParams),
    articleList: [
      { title: __('Common setup problems', 'smashballoon-wpchat-livechat-customer-support'), link: addUtmParams('https://wpchat.com/references/common-setup-problems/', utmParams) },
      { title: __('Error codes explained', 'smashballoon-wpchat-livechat-customer-support'), link: addUtmParams('https://wpchat.com/references/error-codes-explained/', utmParams) },
      { title: __('Troubleshooting FAQs', 'smashballoon-wpchat-livechat-customer-support'), link: addUtmParams('https://wpchat.com/references/troubleshooting-faqs/', utmParams) },
    ],
  }
];
export default function Support() {
  return (
    <Suspense fallback={<SupportSkeleton />}>
      <PageLayout
        breadcrumb={[{ label: __('Support', 'smashballoon-wpchat-livechat-customer-support') }]}
        className='wpchat:max-w-[906px] wpchat:md:pt-18.5'
        disableHelpBtn={true}
      >
        <div className='wpchat:mb-7 wpchat:grid wpchat:gap-3 wpchat:md:grid-cols-2'>
          {cardData.map(({ heading, description, icon, linkText, linkHref, articleList }, index) => (
            <Card
              key={index}
              heading={heading}
              description={description}
              icon={icon}
              articleList={articleList}
              linkText={linkText}
              linkHref={linkHref}
            />
          ))}
        </div>
        <NeedHelp className='wpchat:mb-3' />
        <SystemInfo />
      </PageLayout>
    </Suspense>
  );
}
