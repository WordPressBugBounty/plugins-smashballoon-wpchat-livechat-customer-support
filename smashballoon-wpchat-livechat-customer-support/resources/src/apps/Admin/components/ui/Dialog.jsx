import React from 'react';
import { Dialog as RACDialog } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

/**
 * Generic dialog/modal component for displaying overlay content.
 *
 * @param {Object} props - Props passed to the Dialog component.
 * @returns {JSX.Element} The rendered Dialog component.
 */
export function Dialog(props) {
  return (
    <RACDialog
      {...props}
      className={twMerge(
        'wpchat:relative wpchat:max-h-[inherit] wpchat:overflow-auto wpchat:outline-0',
        props.className,
      )}
    />
  );
}
