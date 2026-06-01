import React from 'react';
import { cn } from '@Utils/cn';

/**
 * HeadingAndContent renders a container with an optional heading section and content area.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} [props.headingLeft] - Content to display on the left side of the heading.
 * @param {React.ReactNode} [props.headingRight] - Content to display on the right side of the heading.
 * @param {string} [props.headingParentClassName] - Additional class names for the heading container.
 * @param {React.ReactNode} props.children - Content to render in the body section.
 * @param {string} [props.childrenClassName] - Additional class names for the children container.
 * @param {string} [props.className] - Additional class names for the root container.
 *
 * @returns {JSX.Element} Rendered heading and content container.
 *
 * @example
 * <HeadingAndContent
 *   headingLeft={<span>Title</span>}
 *   headingRight={<button>Action</button>}
 * >
 *   <p>Body content here</p>
 * </HeadingAndContent>
 */
export default function HeadingAndContent({
  headingLeft = '',
  headingRight = '',
  headingParentClassName = '',
  children,
  childrenClassName = '',
  className = '',
}) {
  return (
    <div className={cn('wpchat:shadow-md', className)}>
      {(headingLeft || headingRight) && (
        <div
          className={cn(
            'wpchat:px-6 wpchat:py-3.5 wpchat:rounded-ss-lg wpchat:rounded-se-lg wpchat:border-b wpchat:border-gray-200 wpchat:bg-white wpchat:flex wpchat:items-center wpchat:justify-between',
            headingParentClassName
          )}
        >
          <div>{headingLeft}</div>
          <div>{headingRight}</div>
        </div>
      )}

      {children && (
        <div
          className={cn(
            'wpchat:bg-white wpchat:p-5 wpchat:rounded-es-lg wpchat:rounded-ee-lg',
            childrenClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
