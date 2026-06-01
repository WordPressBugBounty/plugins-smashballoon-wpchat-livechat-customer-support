import React from 'react';
import { twMerge } from 'tailwind-merge';

const Step = ({ title, description, children, bodyClassName = '', contentClassName = '', containerClassName = '', titleClassName = '' }) => {
  return (
    <div className={twMerge('wpchat:w-full wpchat:rounded-lg wpchat:bg-white wpchat:shadow-lg wpchat:border wpchat:border-gray-100', containerClassName)}>
      <div className={twMerge('wpchat:px-6 wpchat:pt-5', bodyClassName)}>
        {(title || description) && (
          <div className={twMerge('wpchat:mb-8', titleClassName)}>
            {title && (
              <h1 className='wpchat:my-0 wpchat:text-lg wpchat:leading-[160%] wpchat:font-semibold wpchat:text-gray-900'>
                {title}
              </h1>
            )}
            {description && (
              <p className='wpchat:my-0 wpchat:text-sm wpchat:leading-[160%] wpchat:text-gray-500'>
                {description}
              </p>
            )}
          </div>
        )}
        <div className='wpchat:w-full'>
          <div className={twMerge('wpchat:flex wpchat:w-full wpchat:items-center wpchat:justify-center', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step;
