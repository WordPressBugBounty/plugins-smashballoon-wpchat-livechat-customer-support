import React from 'react';
import { getImagePath } from '@Utils/getImagePath';

/**
 * InfoBlock component displays a section with a title, description,
 * optional call-to-action button, and an image.
 *
 * @component
 * @param {Object} props - Props passed to the component.
 * @param {string} props.title - The main heading text.
 * @param {string} props.description - Supporting text or explanation.
 * @param {JSX.Element} [props.CTABtn] - Optional call-to-action button component.
 * @param {JSX.Element} props.image - Image or graphic element to display.
 * @returns {JSX.Element} The rendered InfoBlock component.
 */
export default function InfoBlock({ title, description, CTABtn, image }) {
  const { imageName, imageAlt } = image || {};

  return (
    <div className='wpchat:border-wp-light-blue-500 wpchat:rounded-lg wpchat:border-t-2 wpchat:bg-white wpchat:px-7 wpchat:py-6'>
      <div className='wpchat:mb-4.5 wpchat:grid wpchat:grid-cols-1 wpchat:gap-1 wpchat:md:grid-cols-[80fr_20fr]'>
        <div>
          {title && (
            <h3 className='wpchat:text-gray-900 wpchat:my-0 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold'>
              {title}
            </h3>
          )}
          {description && (
            <p className='wpchat:text-gray-500 wpchat:mt-0 wpchat:text-sm wpchat:leading-relaxed'>
              {description}
            </p>
          )}
        </div>
        <div className='wpchat:flex wpchat:items-start wpchat:gap-3 wpchat:md:justify-end'>
          {CTABtn && CTABtn}
        </div>
      </div>
      {(imageName || imageAlt) && (
        <img className='wpchat:rounded-lg' src={getImagePath(imageName)} alt={imageAlt} />
      )}
    </div>
  );
}
