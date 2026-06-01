import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import TitleDescription from '@Components/TitleDescription';
import SvgLoader from '@Components/SvgLoader';

const features = [
  {
    icon: 'displayEye',
    title: __('Visibility', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Tweak Chatbot visibility on your website', 'smashballoon-wpchat-livechat-customer-support'),
    path: '/visibility',
  },
  {
    icon: 'user',
    title: __('Agents', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Add multiple support executives', 'smashballoon-wpchat-livechat-customer-support'),
    path: '/agents',
  },
  {
    icon: 'filterVariant',
    title: __('Chat Funnels', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Add page specific funnels to inform or convert', 'smashballoon-wpchat-livechat-customer-support'),
    path: '/funnels',
  },
  {
    icon: 'questionMarkCircle',
    title: __('Frequent Questions', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Add often asked questions upfront and save time', 'smashballoon-wpchat-livechat-customer-support'),
    path: '/faqs',
  },
];

function FeatureCard({ icon, title, description, path }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) navigate(path);
  };

  if (!title && !description) return null;

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className='wpchat:hover:bg-wp-light-blue-50 wpchat:outline-wp-light-blue-500-20 wpchat:cursor-pointer wpchat:rounded-2xl wpchat:bg-white wpchat:px-4 wpchat:py-5 wpchat:text-center wpchat:shadow-sm wpchat:transition wpchat:outline-solid wpchat:hover:shadow-md wpchat:focus:bg-white wpchat:focus-visible:outline-4'
    >
      {icon && (
        <div className='wpchat:mb-5 wpchat:flex wpchat:items-center wpchat:justify-center'>
          <div className='wpchat:bg-wp-blue-50 wpchat:rounded-full wpchat:w-[44px] wpchat:h-[44px] wpchat:relative'>
            <SvgLoader name={icon} className='wpchat:fill-wp-blue-500 wpchat:h-4 wpchat:w-4 wpchat:absolute wpchat:top-1/2 wpchat:left-1/2 wpchat:-translate-1/2' />
          </div>
        </div>
      )}
      <TitleDescription
        title={title}
        description={description}
        TitleTag='h5'
        className='wpchat:text-center'
        titleClassName='wpchat:text-wp-blue-500 wpchat:mb-1.5'
        descriptionClassName='wpchat:text-gray-500 wpchat:mb-0 wpchat:text-[13px]'
      />
    </div>
  );
}

function FeatureCards() {
  if (!features?.length) return null;

  return (
    <div className='wpchat:grid wpchat:grid-cols-2 wpchat:gap-3 wpchat:md:grid-cols-4'>
      {features.map(({ icon, title, description, path }, index) => (
        <FeatureCard key={index} icon={icon} title={title} description={description} path={path} />
      ))}
    </div>
  );
}

export default FeatureCards;
