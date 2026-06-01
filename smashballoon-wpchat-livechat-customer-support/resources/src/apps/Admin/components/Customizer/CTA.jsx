import React from 'react';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

/**
 * CTA (Call To Action) component that displays an icon, title, description, and a button.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.icon - The icon to display in the CTA.
 * @param {string} props.title - The title text of the CTA.
 * @param {string} props.description - The description text of the CTA.
 * @param {string} props.buttonText - The text to display on the CTA button.
 * @param {string} [props.variation] - Optional style variation for the CTA.
 * @param {string} [props.className] - Additional Tailwind CSS classes for custom styling.
 * @param {function} [props.onClick] - Optional click handler for the CTA button.
 *
 * @returns {JSX.Element} The rendered CTA component.
 */
export default function CTA({
  icon,
  title,
  description,
  buttonText,
  variation,
  className,
  onClick,
}) {
  return (
    <>
      {'one' === variation && (
        <div
          className={cn(
            'wpchat:border-gray-200 wpchat:relative wpchat:rounded-xs wpchat:border wpchat:bg-white wpchat:py-5 wpchat:pe-5 wpchat:ps-22 wpchat:shadow-sm',
            className,
          )}
        >
          {icon && (
            <div className='wpchat:bg-wp-blue-50 wpchat:absolute wpchat:top-5 wpchat:start-5 wpchat:flex wpchat:h-12 wpchat:w-12 wpchat:items-center wpchat:justify-center wpchat:rounded-full'>
              <SvgLoader name={icon} className='wpchat:fill-wp-blue-500' />
            </div>
          )}
          <div>
            {title && (
              <h5 className='wpchat:text-gray-900 wpchat:mt-0 wpchat:mb-1 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold'>
                {title}
              </h5>
            )}
            {description && (
              <p className='wpchat:text-gray-500 wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed'>
                {description}
              </p>
            )}
            <Button
              variant='secondary'
              className={cn('wpchat:[&_svg]:fill-gray-900 wpchat:mt-6', className)}
              onPress={onClick}
            >
              <SvgLoader name='chevronRight' className='wpchat:rtl:rotate-180' />
              {buttonText}
            </Button>
          </div>
        </div>
      )}
      {'two' === variation && (
        <div
          className={cn(
            'wpchat:border-gray-200 wpchat:hover:bg-admin-25 wpchat:relative wpchat:cursor-pointer wpchat:rounded-xl wpchat:border wpchat:bg-white wpchat:py-5 wpchat:pe-10 wpchat:ps-15 wpchat:shadow-sm',
            className,
          )}
          role='button'
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick?.(e);
            }
          }}
        >
          {icon && <SvgLoader name={icon} className='wpchat:absolute wpchat:top-5 wpchat:start-5' />}
          <div>
            {title && (
              <h3 className='wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-black'>
                {title}
              </h3>
            )}
            {description && (
              <p className='wpchat:text-gray-500 wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed'>
                {description}
              </p>
            )}
          </div>
          <SvgLoader
            name='chevronRight'
            className='wpchat:absolute wpchat:top-1/2 wpchat:end-5 wpchat:-translate-y-1/2 wpchat:rtl:rotate-180'
          />
        </div>
      )}
    </>
  );
}
