import React from 'react';
import { __ } from '@wordpress/i18n';
import TitleDescription from '@Components/TitleDescription';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

function OnboardingPreview({
  children,
  className = '',
  title = '',
  description = '',
  showArrow = true,
  centerOnMobile = false,
}) {
  const showTitle = Boolean(title);
  const showDescription = Boolean(description);
  const showLeftSection = showArrow || showTitle || showDescription;

  return (
    <div
      className={cn(
        'wpchat:bg-gray-50 wpchat:-mx-6 wpchat:block wpchat:md:grid wpchat:min-h-[275px] wpchat:justify-center wpchat:gap-9 wpchat:overflow-hidden wpchat:px-5 wpchat:pt-8 wpchat:md:pt-12.5 wpchat:pb-0 wpchat:md:grid-cols-2 wpchat:md:justify-start wpchat:rounded-b-sm',
        className,
      )}
    >
      {showLeftSection && (
        <div className='wpchat:relative wpchat:flex wpchat:hidden wpchat:justify-end wpchat:pt-15 wpchat:md:block wpchat:md:ps-12'>
          {showArrow && (
            <SvgLoader
              name='longAngledArrow'
              className='wpchat:fill-gray-500 wpchat:absolute wpchat:top-0 wpchat:end-0 wpchat:rtl:-scale-x-100'
            />
          )}
          {(showTitle || showDescription) && (
            <TitleDescription
              className='wpchat:-rotate-5'
              title={title}
              titleClassName='wpchat:font-semibold'
              descriptionClassName='wpchat:max-w-[240px]'
              description={description}
            />
          )}
        </div>
      )}

      {centerOnMobile ? (
        <div className='wpchat:flex wpchat:justify-center wpchat:md:block wpchat:w-full'>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default OnboardingPreview;
