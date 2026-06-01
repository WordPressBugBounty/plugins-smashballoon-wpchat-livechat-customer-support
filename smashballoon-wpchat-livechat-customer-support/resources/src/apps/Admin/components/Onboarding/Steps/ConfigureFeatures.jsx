import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { Switch } from '@AC/ui/Switch';
import { Badge } from '@AC/ui/Badge';
import ProFeaturesModal from '@AC/Onboarding/ProFeaturesModal';

const ConfigureFeatures = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const rows = [
    {
      key: 'whatsapp',
      icon: 'whatsappSolid',
      name: __('WhatsApp Support', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Redirect users to WhatsApp for support', 'smashballoon-wpchat-livechat-customer-support'),
      pro: false,
    },
    {
      key: 'visibility',
      icon: 'displayEyeOutline',
      name: __('Visibility Controls', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Fine tune chatbot display rules', 'smashballoon-wpchat-livechat-customer-support'),
      pro: false,
    },
    {
      key: 'faqs',
      icon: 'questionMarkCircle',
      name: __('Frequently Asked Questions', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Give customers instant answers for frequently asked questions', 'smashballoon-wpchat-livechat-customer-support'),
      pro: false,
    },
    {
      key: 'multiPlatform',
      icon: 'packageBox',
      name: __('Multi-platform Support', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Add support for Telegram, Instagram, Messages and more', 'smashballoon-wpchat-livechat-customer-support'),
      pro: true,
    },
    {
      key: 'unlimitedFaqs',
      icon: 'questionMarkCircle',
      name: __('Unlimited Frequent Questions', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Display unlimited FAQs with smart search', 'smashballoon-wpchat-livechat-customer-support'),
      pro: true,
    },
    {
      key: 'analytics',
      icon: 'barChart',
      name: __('Advanced Analytics', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Get detailed analytics based on your users engagement', 'smashballoon-wpchat-livechat-customer-support'),
      pro: true,
    },
    {
      key: 'allThemes',
      icon: 'swatchBook',
      name: __('Access to all themes', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Choose from up to 3 themes to fine tune your look', 'smashballoon-wpchat-livechat-customer-support'),
      pro: true,
    },
    {
      key: 'multiAgents',
      icon: 'multipleUsers',
      name: __('Add multiple agents', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Add multiple support agents and we’ll smartly route queries based on availability', 'smashballoon-wpchat-livechat-customer-support'),
      pro: true,
    },
    {
      key: 'funnels',
      icon: 'funnels',
      name: __('Chat Funnels', 'smashballoon-wpchat-livechat-customer-support'),
      desc: __('Display Unlimited Funnels', 'smashballoon-wpchat-livechat-customer-support'),
      pro: true,
    },
  ];

  return (
    <div className='wpchat:w-full'>
      <div className='wpchat:rounded-lg wpchat:bg-white wpchat:shadow wpchat:border wpchat:border-gray-200'>
        <div className='wpchat:px-5 wpchat:py-5 wpchat:border-b wpchat:border-gray-200 wpchat:text-gray-900 wpchat:font-semibold wpchat:text-lg'>
          {__('Configure features', 'smashballoon-wpchat-livechat-customer-support')}
        </div>

        <div className='wpchat:max-h-[60vh] wpchat:overflow-y-auto wpchat:rounded-b-lg'>
          {rows.map((row, index) => {
            const isFree = !row.pro;
            const checked = isFree;
            return (
              <div
                key={row.key}
                className={`wpchat:flex wpchat:items-center wpchat:justify-between wpchat:px-5 wpchat:py-5 ${index % 2 === 0 ? 'wpchat:bg-gray-50' : ''}`}
              >
                <div className='wpchat:flex wpchat:items-start wpchat:gap-4'>
                  <div className='wpchat:mt-1'>
                    <SvgLoader name={row.icon} className='wpchat:w-5 wpchat:h-5 wpchat:text-gray-500' />
                  </div>
                  <div>
                    <div className='wpchat:flex wpchat:items-center wpchat:gap-2'>
                      <div className='wpchat:text-gray-900 wpchat:text-base wpchat:font-semibold'>{row.name}</div>
                      {row.pro && (
                        <Badge className='wpchat:bg-wp-blue-50 wpchat:rounded-xl wpchat:px-1.5 wpchat:py-0.5 wpchat:text-xs'>
                          {__('Pro', 'smashballoon-wpchat-livechat-customer-support')}
                        </Badge>
                      )}
                    </div>
                    <div className='wpchat:text-gray-700 wpchat:text-sm'>{row.desc}</div>
                  </div>
                </div>
                <Switch
                  isSelected={checked}
                  onChange={() => {
                    if (!isFree) {
                      setShowUpgrade(true);
                    }
                  }}
                  isDisabled={isFree}
                />
              </div>
            );
          })}
        </div>
      </div>

      {showUpgrade && (
        <div 
          className='wpchat:fixed wpchat:inset-0 wpchat:z-[2147483647] wpchat:flex wpchat:items-center wpchat:justify-center wpchat:bg-black/30'
          onClick={() => setShowUpgrade(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ProFeaturesModal
              features={rows.filter((r) => r.pro).slice(0, 3)}
              onPrimary={() => window.open(wpChatAdmin?.upgradeUrl || '#', '_blank')}
              onSecondary={() => setShowUpgrade(false)}
              onClose={() => setShowUpgrade(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigureFeatures;


