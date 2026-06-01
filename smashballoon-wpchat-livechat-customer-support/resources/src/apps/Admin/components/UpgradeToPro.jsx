import React from 'react';
import { __ } from '@wordpress/i18n';
import { LinkButton } from '@AC/ui/LinkButton';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

/**
 * UpgradeToPro component highlights the benefits of upgrading to a premium/pro version.
 * It displays a title, description, two call-to-action buttons, and a list of features.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.title - Main heading for the section.
 * @param {string} props.description - Subtext or explanation for the upgrade.
 * @param {Object} props.btn1 - Primary call-to-action button ({ label, link }).
 * @param {Object} props.btn2 - Secondary call-to-action button ({ label, link }).
 * @param {string[]} props.features - List of feature descriptions or benefits.
 * @param {'left' | 'right'} [props.iconPosition] - Position of icons or decorative elements, if applicable.
 * @param {string} [props.className] - Additional custom class names.
 *
 * @returns {JSX.Element} The rendered UpgradeToPro component.
 */
export default function UpgradeToPro({
  title,
  description,
  btn1,
  btn2,
  features,
  iconPosition,
  className,
}) {
  // Default buttons if none are provided
  const defaultBtn1 = {
    label: __('Upgrade', 'smashballoon-wpchat-livechat-customer-support'),
    link: window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing',
  };

  const defaultBtn2 = {
    label: __('Learn More', 'smashballoon-wpchat-livechat-customer-support'),
    link: window.wpChatAdmin?.urls?.pricing || 'https://wpchat.com/pricing',
  };

  const button1 = { ...defaultBtn1, ...btn1 };
  const button2 = { ...defaultBtn2, ...btn2 };

  return (
    <div className={cn('wpchat:border-green-600 wpchat:rounded-lg wpchat:border-t-2 wpchat:bg-white wpchat:px-4 wpchat:py-5 wpchat:md:px-7 wpchat:md:py-6  wpchat:mt-3', className)}>
      <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-4 wpchat:pb-8 wpchat:md:grid-cols-[65fr_35fr] wpchat:md:gap-3'>
        <div>
          {title && (
            <h3 className='wpchat:my-0 wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900'>
              {title}
            </h3>
          )}
          {description && (
            <p className='wpchat:mt-0 wpchat:text-sm wpchat:text-gray-500'>{description}</p>
          )}
        </div>

        <div className='wpchat:flex wpchat:items-start wpchat:gap-3 wpchat:md:justify-end'>
          <LinkButton
            href={button1.link}
            target='_blank'
            rel='noopener noreferrer'
            variant='tertiary'
          >
            {button1.label}
            <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
          </LinkButton>

          <LinkButton
            href={button2.link}
            target='_blank'
            rel='noopener noreferrer'
            variant='secondary'
          >
            {button2.label}
          </LinkButton>
        </div>
      </div>

      {features && features.length > 0 && (
        <div
          className={cn(
            'wpchat:grid wpchat:gap-2',
            features.length === 1 && 'wpchat:md:grid-cols-1',
            features.length === 2 && 'wpchat:md:grid-cols-2',
            features.length === 3 && 'wpchat:md:grid-cols-3',
            features.length > 4 && 'wpchat:md:grid-cols-3'
          )}
        >
          {features.map(({ icon, title, description }, index) => (
            <div
              key={index}
              className={cn(
                'wpchat:rounded-lg wpchat:border wpchat:border-gray-100 wpchat:p-5 wpchat:shadow-md wpchat:[background:var(--wpchat-color-admin-gradient)]',
                iconPosition && 'wpchat:flex wpchat:items-start'
              )}
            >
              {icon && (
                <div
                  className={cn(
                    'wpchat:inline-block wpchat:rounded-full wpchat:bg-white wpchat:p-2.5 wpchat:shadow-md',
                    iconPosition && 'wpchat:me-5'
                  )}
                >
                  {icon}
                </div>
              )}

              <div className={cn('', !iconPosition && 'wpchat:mt-5')}>
                {title && (
                  <h5 className='wpchat:mt-0 wpchat:mb-0.5 wpchat:text-sm wpchat:leading-[1.6] wpchat:font-semibold wpchat:text-gray-900'>
                    {title}
                  </h5>
                )}
                {description && (
                  <p className='wpchat:mt-0 wpchat:text-xs wpchat:leading-[1.6] wpchat:text-gray-800'>
                    {description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
