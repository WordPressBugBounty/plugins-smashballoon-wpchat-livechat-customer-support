import cn from 'classnames';
import React from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';

/**
 * CalloutCard Component
 *
 * A reusable UI component that displays a callout box with an optional icon,
 * title, and description. Useful for drawing attention to specific information.
 *
 * @component
 * @example
 * return (
 *   <CalloutCard
 *     iconName="info"
 *     title="Important Info"
 *     description="This is some important information."
 *     className="custom-class"
 *     titleClassName="custom-title"
 *     descriptionClassName="custom-description"
 *     iconClassName="custom-icon"
 *   />
 * );
 *
 * @param {Object} props - Component props
 * @param {string} [props.iconName=''] - Name of the icon to display (passed to SvgLoader). If empty, no icon is shown.
 * @param {string} [props.title=''] - Title text displayed in the card.
 * @param {string} [props.description=''] - Description text displayed below the title.
 * @param {string} [props.className] - Additional classes for the outer container.
 * @param {string} [props.titleClassName] - Additional classes for the title element.
 * @param {string} [props.descriptionClassName] - Additional classes for the description element.
 * @param {string} [props.iconClassName] - Additional classes for the icon element.
 *
 * @returns {JSX.Element} The rendered CalloutCard component.
 */

export default function CalloutCard({
  iconName = '',
  title = '',
  description = '',
  className,
  titleClassName,
  descriptionClassName,
  iconClassName,
}) {
  return (
    <div
      className={cn(
        'wpchat:flex wpchat:items-start wpchat:gap-4 wpchat:rounded-lg wpchat:border wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:text-sm wpchat:py-5 wpchat:px-7',
        className,
      )}
    >
      {iconName && (
        <SvgLoader
          name={iconName}
          className={cn(
            'wpchat:h-6 wpchat:w-6 wpchat:flex-shrink-0',
            iconClassName,
          )}
        />
      )}
      <div>
        {(title || description) && (
          <TitleDescription
            title={title}
            description={description}
            className='m-0'
            titleClassName={cn(
              'wpchat:text-gray-900',
              titleClassName,
            )}
            descriptionClassName={cn('wpchat:text-gray-800', descriptionClassName)}
          />
        )}
      </div>
    </div>
  );
}
