import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

/**
 * DefaultModal Component
 *
 * A flexible modal dialog component with optional header, customizable footer buttons,
 * and support for styled content in the body. Typically used for confirmations, forms, or dialogs.
 *
 * @component
 * @example
 * return (
 *   <DefaultModal
 *     title="Delete Item"
 *     setIsOpen={setModalOpen}
 *     button={<Button variant="danger">Delete</Button>}
 *   >
 *     <p>Are you sure you want to delete this item?</p>
 *   </DefaultModal>
 * );
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Title text displayed in the modal header.
 * @param {Function} props.setIsOpen - Function to control modal visibility (typically via state).
 * @param {React.ReactNode} props.button - Custom button element rendered in the footer (e.g., submit or confirm button).
 * @param {React.ReactNode} props.children - Content to display inside the modal body.
 * @param {string} [props.cancelButtonVariant='secondary'] - Variant for the cancel button (e.g., 'secondary', 'ghost').
 * @param {string} [props.cancelButtonText='Cancel'] - Text label for the cancel button.
 * @param {boolean} [props.disableCancelButton=false] - If true, hides the cancel button.
 * @param {boolean} [props.hideHeader=false] - If true, hides the modal header.
 * @param {string} [props.bodyClassName] - Additional class names for the modal body container.
 * @param {string} [props.variant='default'] - Style variant: 'default' for standard modal with header/footer borders, 'simple' for minimal compact style.
 *
 * @returns {JSX.Element} The rendered DefaultModal component.
 */

function DefaultModal({
  title,
  setIsOpen,
  button,
  children,
  cancelButtonVariant = 'secondary',
  cancelButtonText = __('Cancel', 'smashballoon-wpchat-livechat-customer-support'),
  disableCancelButton = false,
  hideHeader = false,
  bodyClassName,
  variant = 'default',
}) {
  if (variant === 'simple') {
    return (
      <div className='wpchat:mx-auto wpchat:w-full wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-2xl wpchat:md:w-[460px]'>
        <h5 className='wpchat:m-0 wpchat:mb-2 wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900'>
          {title}
        </h5>
        <div className={cn('wpchat:mb-8 wpchat:text-gray-700 wpchat:text-sm', bodyClassName)}>{children}</div>
        <div className='wpchat:flex wpchat:justify-end wpchat:gap-2'>
          {!disableCancelButton && (
            <Button onPress={() => setIsOpen(false)} variant={cancelButtonVariant}>
              {cancelButtonText}
            </Button>
          )}
          {button}
        </div>
      </div>
    );
  }

  return (
    <div className='wpchat:mx-auto wpchat:w-full wpchat:rounded-lg wpchat:bg-white wpchat:shadow-2xl wpchat:md:w-[532px]'>
      {/* Header */}
      {!hideHeader && (
        <div className='wpchat:flex wpchat:items-center wpchat:justify-between wpchat:border-b wpchat:border-gray-200 wpchat:px-8 wpchat:py-4'>
          <h5 className='wpchat:m-0 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
            {title}
          </h5>
          <SvgLoader
            name='close'
            className='wpchat:h-[1.8em] wpchat:w-[1.8em] wpchat:cursor-pointer wpchat:fill-gray-500'
            role='button'
            tabIndex={0}
            aria-label={__('Close', 'smashballoon-wpchat-livechat-customer-support')}
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsOpen(false);
                e.preventDefault();
              }
            }}
          />
        </div>
      )}

      {/* Body */}
       <div className={cn('wpchat:px-8.5 wpchat:pt-8 wpchat:pb-14', bodyClassName)}>{children}</div>

      {/* Footer */}
      <div className='wpchat:flex wpchat:justify-end wpchat:gap-2 wpchat:border-t wpchat:border-gray-200 wpchat:px-8 wpchat:py-4'>
        {!disableCancelButton && (
          <Button onPress={() => setIsOpen(false)} variant={cancelButtonVariant}>
            {cancelButtonText}
          </Button>
        )}
        {button}
      </div>
    </div>
  );
}

export default DefaultModal;
