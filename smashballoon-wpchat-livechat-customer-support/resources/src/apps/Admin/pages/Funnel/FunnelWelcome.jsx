import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import PageLayout from '@AC/PageLayout';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import SvgLoader from '@Components/SvgLoader';
import useFunnelsStore from '@DataStore/funnels/funnelsStore';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { getImagePath } from '@Utils/getImagePath';

/**
 * FunnelWelcome component displays an introductory UI for
 * the Funnel section when no funnel is selected.
 * It provides information about creating, embedding, and
 * analyzing funnels, along with a call-to-action to create a new funnel.
 *
 * @component
 * @returns {JSX.Element} The rendered FunnelWelcome component.
 */
export default function FunnelWelcome() {
  const navigate = useNavigate();

  const { resetFunnelWithDummyBlock } = useFunnelsStore();
  const { funnelLimits, hasFunnelsEntitlement } = useEntitlements();

  const funnelNotPro = !hasFunnelsEntitlement || !funnelLimits?.canCreateMore;

  /** Array of funnel feature info to display in cards */
  const funnelFeatures = [
    {
      icon: 'mapsUgc',
      title: __('Create detailed funnels', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Add 1 message or 20. You funnel can be as detailed as you want',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      icon: 'addToQueue',
      title: __('Embed on any page you want', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Our embed controls enable you to display the funnel on whichever page you want',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      icon: 'barChart',
      title: __('Get detailed analytics', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Get detailed analytics based on how many people finished and interacted with the funnel',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
  ];

  return (
    <PageLayout
      breadcrumb={[{ label: __('Chat Funnels', 'smashballoon-wpchat-livechat-customer-support') }]}
      className='wpchat:max-w-4xl wpchat:md:pt-13'
    >
      <div className='wpchat:mb-7 wpchat:grid wpchat:grid-cols-1 wpchat:border-b wpchat:border-gray-200 wpchat:md:grid-cols-2'>
        <img
          src={getImagePath('funnel-welcome.png')}
          alt={__('funnels', 'smashballoon-wpchat-livechat-customer-support')}
        />
        <div className='wpchat:mb-7 wpchat:w-full wpchat:pt-7 wpchat:md:ms-10 wpchat:md:max-w-[295px]'>
          {funnelNotPro && <SvgLoader name='lockedBadgeText' className="wpchat:mb-1"/>}
          <h3 className='wpchat:mt-0 wpchat:mb-1 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
            {__('Convert your users with your funnel', 'smashballoon-wpchat-livechat-customer-support')}
          </h3>
          <p className='wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-500'>
            {__(
              'Create multi-message funnels and get detailed analytics for all of them. Start creating your first funnel today.',
              'smashballoon-wpchat-livechat-customer-support',
            )}
          </p>
          <Button
            className='wpchat:mt-8'
            variant={funnelNotPro ? 'tertiary' : 'primary'}
            onPress={() => {
              // Check if user has funnels entitlement and can create more
              if (funnelNotPro) {
                window.open(
                  window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing',
                  '_blank',
                  'noopener,noreferrer'
                );
              } else {
                resetFunnelWithDummyBlock();
                navigate('/funnels/create');
              }
            }}
          >

            {!funnelNotPro && <SvgLoader name='plus' className='wpchat:h-[1.3em] wpchat:w-[1.3em]' />}
            {funnelNotPro ? __('Upgrade', 'smashballoon-wpchat-livechat-customer-support') : __('New Funnel', 'smashballoon-wpchat-livechat-customer-support')}
            {funnelNotPro && <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />}
          </Button>
        </div>
      </div>

      <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-3 wpchat:md:grid-cols-3 wpchat:md:gap-2'>
        {funnelFeatures.map(({ icon, title, description }, index) => (
          <div key={index} className='wpchat:md:p-5'>
            <div className='wpchat:relative wpchat:mb-5 wpchat:h-10 wpchat:w-10 wpchat:rounded-full wpchat:shadow-md'>
              <SvgLoader
                name={icon}
                className='wpchat:absolute wpchat:top-2.5 wpchat:end-2.5 wpchat:h-[1.6em] wpchat:w-[1.6em] wpchat:fill-gray-900'
              />
            </div>
            <h5 className='wpchat:mt-0 wpchat:mb-0.5 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
              {title}
            </h5>
            <p className='wpchat:mt-0 wpchat:text-[13px] wpchat:leading-relaxed wpchat:text-gray-800'>
              {description}
            </p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
