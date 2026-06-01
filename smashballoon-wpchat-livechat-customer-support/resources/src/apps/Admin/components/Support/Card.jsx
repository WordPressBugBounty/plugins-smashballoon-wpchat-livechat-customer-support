import React from 'react';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';

function Card({ heading, description, icon, articleList, linkText, linkHref }) {
  return (
    <div className='wpchat:flex wpchat:h-full wpchat:flex-col wpchat:rounded-xs wpchat:bg-white wpchat:px-4.5 wpchat:py-5.5 wpchat:shadow-md'>
      {/* Header Section */}
      <div className='wpchat:mb-6'>
        {/* Icon Container */}
        {icon && (
          <div className='wpchat:bg-wp-blue-50 wpchat:mb-5 wpchat:flex wpchat:h-14 wpchat:w-14 wpchat:items-center wpchat:justify-center wpchat:rounded-full'>
            <SvgLoader name={icon} className='wpchat:fill-wp-blue-500 wpchat:h-6 wpchat:w-6' />
          </div>
        )}

        {/* Title and Description */}
        {heading && (
          <h3 className='wpchat:text-gray-900 wpchat:mt-0 wpchat:mb-0.5 wpchat:truncate wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold'>
            {heading}
          </h3>
        )}
        {description && (
          <p className='wpchat:text-gray-500 wpchat:mt-0 wpchat:mb-0 wpchat:text-xs wpchat:leading-relaxed'>
            {description}
          </p>
        )}
      </div>

      {/* Articles List - grows to fill available space */}
      <ul className='wpchat:mb-10 wpchat:flex-grow'>
        {articleList.map(({ title, link }, idx) => {
          const isLast = idx === articleList.length - 1;

          return (
            <li key={link} className='wpchat:relative'>
              <a
                href={link}
                className={`wpchat:border-gray-200 wpchat:block wpchat:truncate wpchat:py-3 wpchat:pe-4 ${
                  isLast ? '' : 'wpchat:border-b'
                }`}
              >
                {title}
                <SvgLoader
                  name='chevronRight'
                  className='wpchat:fill-gray-500 wpchat:absolute wpchat:top-1/2 wpchat:end-0 wpchat:h-4 wpchat:w-4 wpchat:-translate-y-1/2 wpchat:rtl:rotate-180'
                />
              </a>
            </li>
          );
        })}
      </ul>

      {/* Button - always at bottom */}
      {linkText && linkHref && (
        <div className='wpchat:mt-auto'>
          <Button
            variant='secondary'
            className='wpchat:mx-auto wpchat:w-full wpchat:justify-center wpchat:text-center'
            onPress={() => window.open(linkHref, '_blank', 'noopener,noreferrer')}
          >
            {linkText}
          </Button>
        </div>
      )}
    </div>
  );
}

export default Card;
