import React from 'react';
import { getImagePath } from '@Utils/getImagePath';
import TitleDescription from '@Components/TitleDescription';
import { cn } from '@Utils/cn';

/**
 * TextImage component displays a number, title, description, and an image.
 * Use `stackedLayout` to toggle between original and modern layout.
 *
 * @component
 * @param {Object} props
 * @param {number|string} props.number - Step number or identifier.
 * @param {string} props.title - Block title.
 * @param {string} props.description - Block description.
 * @param {string} props.imageName - Image file name.
 * @param {string} props.altText - Image alt text.
 * @param {boolean} props.stackedLayout - Whether to use stacked layout (new version).
 * @returns {JSX.Element}
 */
export default function TextImage({
  number,
  title,
  description,
  imageName,
  altText,
  stackedLayout = false,
  className
}) {
  const renderNumber = () => (
    <div
      className={cn(
        'wpchat:bg-gray-100 wpchat:text-gray-900 wpchat:w-6 wpchat:h-6 wpchat:rounded-full wpchat:flex wpchat:items-center wpchat:justify-center wpchat:text-xs wpchat:font-semibold',
        { 'wpchat:absolute wpchat:top-7 wpchat:start-7': !stackedLayout }
      )}
    >
      {number}
    </div>
  );

  const leftSectionClass = cn(
    {
      'wpchat:w-full wpchat:md:w-1/2 wpchat:flex wpchat:flex-col wpchat:gap-5': stackedLayout,
      'wpchat:relative wpchat:w-full wpchat:py-7 wpchat:pe-2 wpchat:ps-18 wpchat:md:w-1/2': !stackedLayout,
    }
  );

const containerClass = cn(
  'wpchat:flex wpchat:flex-wrap wpchat:bg-white wpchat:md:flex-nowrap wpchat:items-start',
  {
    'wpchat:mb-3 wpchat:rounded-lg wpchat:shadow-md': !stackedLayout,
    'wpchat:gap-4': stackedLayout, // add gap only when stackedLayout is true
  },
  className
);


  return (
    <div className={containerClass}>
      <div className={leftSectionClass}>
        {number && renderNumber()}

        <TitleDescription
          title={title}
          description={description}
          descriptionClassName='wpchat:text-gray-800'
          titleClassName='wpchat:mb-2'
          className='wpchat:mb-0'
        />
      </div>

      <div className="wpchat:w-full wpchat:md:w-1/2 wpchat:flex wpchat:justify-center wpchat:md:justify-end">
        {imageName && altText && (
          <img
            src={getImagePath(imageName)}
            alt={altText}
            className="wpchat:max-w-full wpchat:rounded-lg wpchat:object-contain"
          />
        )}
      </div>
    </div>
  );
}