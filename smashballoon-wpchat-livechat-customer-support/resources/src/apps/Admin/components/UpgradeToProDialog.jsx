import React from 'react';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { getImagePath } from '@Utils/getImagePath';

/**
 * UpgradeToProDialog component displays a modal/dialog to promote upgrading to a Pro version.
 * Includes a title, description, optional coupon, image, feature list, and two action buttons.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.title - Main heading for the dialog.
 * @param {string} props.description - Supporting text for the upgrade message.
 * @param {string} [props.coupon] - Optional coupon code or promotional text.
 * @param {JSX.Element} props.image - Visual element or illustration in the dialog.
 * @param {string[]} props.features - List of features or benefits of upgrading.
 * @param {JSX.Element} props.primaryBtn - Primary call-to-action button.
 * @param {JSX.Element} props.secondaryBtn - Secondary button (e.g., cancel or skip).
 * @returns {JSX.Element} The rendered UpgradeToProDialog component.
 */
function UpgradeToProDialog({
  title,
  description,
  coupon,
  image,
  features,
  primaryBtn,
  secondaryBtn,
}) {
  const { couponTitle, couponDescription } = coupon || {};
  const { imageName, imageAlt } = image || {};
  const { featuresTitle, featuresList } = features || {};
  const { primaryBtnLink, primaryBtnText } = primaryBtn || {};
  const { secondaryBtnLink, secondaryBtnText } = secondaryBtn || {};

  return (
    <div className='wpchat:w-full wpchat:max-w-[874px] wpchat:rounded-lg wpchat:bg-white wpchat:shadow-2xl'>
      <section className='wpchat:bg-gray-100 wpchat:grid wpchat:grid-cols-1 wpchat:gap-5 wpchat:rounded-ss-lg wpchat:rounded-se-lg wpchat:p-4 wpchat:pb-0 wpchat:md:grid-cols-[50fr_50fr] wpchat:md:gap-3 wpchat:md:pt-6 wpchat:md:pe-13 wpchat:md:ps-10 wpchat:items-end'>
        <div className='wpchat:pb-8'>
          {title && (
            <h2 className='wpchat:text-gray-900 wpchat:mt-0 wpchat:mb-3 wpchat:text-2xl wpchat:font-semibold wpchat:md:text-3xl'>
              {title}
            </h2>
          )}
          {description && (
            <p className='wpchat:text-gray-500 wpchat:mt-0 wpchat:mb-5 wpchat:md:max-w-[322px] wpchat:text-xs wpchat:leading-relaxed'>
              {description}
            </p>
          )}
          {(couponTitle || couponDescription) && (
            <div className='wpchat:border-gray-200 wpchat:relative wpchat:max-w-[265px] wpchat:rounded-xs wpchat:border wpchat:bg-white wpchat:py-2 wpchat:pe-3 wpchat:ps-10'>
              <SvgLoader
                name='tagOutline'
                className='wpchat:absolute wpchat:top-2.5 wpchat:start-2.5 wpchat:h-[1.6em] wpchat:w-[1.6em] wpchat:fill-wp-blue-500'
              />
              {couponTitle && (
                <h6 className='wpchat:text-wp-blue-500 wpchat:m-0 wpchat:text-sm wpchat:font-semibold'>
                  {couponTitle}
                </h6>
              )}
              {couponDescription && (
                <p className='wpchat:text-wp-blue-500 wpchat:m-0 wpchat:text-xs'>{couponDescription}</p>
              )}
            </div>
          )}
        </div>
        {(imageName || imageAlt) && <img src={getImagePath(imageName)} alt={imageAlt} />}
      </section>

      <section className='wpchat:p-4 wpchat:md:px-10 wpchat:md:pt-5 wpchat:md:pb-5'>
        {featuresTitle && (
          <h5 className='wpchat:text-gray-900 wpchat:mt-0 wpchat:mb-4 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold'>
            {featuresTitle}
          </h5>
        )}

        {featuresList && featuresList.length > 0 && (
          <ul className='wpchat:grid wpchat:list-disc wpchat:gap-x-8 wpchat:gap-y-2 wpchat:ps-5 wpchat:marker:text-blue-500 wpchat:md:grid-cols-3 wpchat:grid-cols-3'>
            {featuresList.map((feature, index) => (
              <li
                key={index}
                className='wpchat:text-gray-700 wpchat:mb-0 wpchat:text-sm wpchat:leading-relaxed'
              >
                {feature}
              </li>
            ))}
          </ul>
        )}

        <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-3 wpchat:pt-10 wpchat:md:grid-cols-[81fr_19fr]'>
          {primaryBtn && primaryBtnLink && (
            <Button
              className='wpchat:w-full wpchat:justify-center wpchat:p-3 wpchat:text-base'
              variant='tertiary'
              onPress={() => (window.location.href = primaryBtnLink)}
            >
              <SvgLoader name='arrowUpLoading' className='wpchat:h-[1.3em] wpchat:w-[1.3em]' />
              {primaryBtnText}
            </Button>
          )}

          {secondaryBtn && secondaryBtnLink && (
            <Button
              className='wpchat:w-full wpchat:justify-center wpchat:p-3 wpchat:text-center wpchat:text-base wpchat:md:justify-start'
              variant='secondary'
              onPress={() => (window.location.href = secondaryBtnLink)}
            >
              {secondaryBtnText}
              <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

export default UpgradeToProDialog;
