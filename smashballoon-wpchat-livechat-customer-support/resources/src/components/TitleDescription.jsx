import React from 'react';
import { Badge } from '@AC/ui/Badge';
import { cn } from '@Utils/cn';

/**
 * TitleDescription component renders a heading with a supporting description,
 * and optionally displays a badge next to the title.
 * Commonly used for section headers, introductions, or explanatory text blocks.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.title - The main title text.
 * @param {string} props.description - Supporting description text displayed below the title.
 * @param {string} [props.className] - Optional additional class names for the container.
 * @param {string} [props.titleClassName] - Optional additional class names for the title element.
 * @param {string} [props.descriptionClassName] - Optional additional class names for the description element.
 * @param {React.ElementType} [props.TitleTag='h5'] - Tag or component to render as the title (e.g., 'h1', 'h2', etc.).
 * @param {string} [props.badgeType] - Optional badge type to determine styling (e.g., 'info', 'warning', etc.).
 * @param {string} [props.badgeText] - Optional text to display inside the badge.
 *
 * @returns {JSX.Element} The rendered TitleDescription component.
 */
export default function TitleDescription({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  TitleTag = 'h5',
  badgeType,
  badgeText,
}) {
  return (
    <section className={cn('wpchat:mb-4.5', className)}>
      {title && (
        <>
          <TitleTag
            className={cn(
              'wpchat:text-gray-900 wpchat:inline-block wpchat:w-auto wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:m-0',
              titleClassName,
            )}
          >
            {title}
          </TitleTag>
          {badgeType && badgeText && (
            <Badge variant={badgeType} className='wpchat:ms-2'>
              {badgeText}
            </Badge>
          )}
        </>
      )}
      {description && (
        <p
          className={cn(
            'wpchat:text-gray-500 wpchat:mt-0 wpchat:max-w-[465px] wpchat:text-sm wpchat:leading-relaxed',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      )}
    </section>
  );
}
