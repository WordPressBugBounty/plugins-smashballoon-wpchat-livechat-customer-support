import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import DefaultModal from '@AC/DefaultModal';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

// Delay needed for WordPress media library modal to fully close before reopening parent modal
const MODAL_REOPEN_DELAY_MS = 100;

/**
 * Component for handling image upload using WordPress media library.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.onFileSelect - Callback function to handle the selected file.
 * @param {string} [props.mode='simple'] - The display mode: 'simple' for just the upload button, 'preview' for button with preview.
 * @param {string} [props.className] - Additional CSS classes for styling.
 * @param {string} [props.previewClassName] - Additional CSS classes for the preview container.
 * @param {string} [props.file] - Initial file URL to display in preview mode (only used in preview mode).
 * @param {Function} [props.onReset] - Optional callback function for reset button. If provided, a reset button will be shown next to the upload button.
 *
 * @returns {JSX.Element} The rendered ImageUpload component.
 */
export default function ImageUpload({ onFileSelect, mode = 'simple', className, previewClassName, file, modalSetIsOpen, onReset }) {
  const [previewUrl, setPreviewUrl] = useState(mode === 'preview' ? file : null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (mode === 'preview') {
      setPreviewUrl(file);
    }
  }, [file, mode]);

  const handleMediaUpload = () => {
    if (!window.wp || !window.wp.media) {
      console.error(__('WordPress media library is not available.', 'smashballoon-wpchat-livechat-customer-support'));
      return;
    }

    // If we have a modal setter, close the modal before opening media library
    if (modalSetIsOpen) {
      modalSetIsOpen(false);
    }

    const mediaUploader = wp.media({
      title: __('Select or Upload an Image', 'smashballoon-wpchat-livechat-customer-support'),
      button: {
        text: __('Use this image', 'smashballoon-wpchat-livechat-customer-support'),
      },
      multiple: false,
      library: {
        type: 'image',
      },
    });

    mediaUploader.on('select', () => {
      const attachment = mediaUploader.state().get('selection').first().toJSON();
      setPreviewUrl(attachment.url);
      onFileSelect(attachment.url);

      // Reopen modal after selection if needed
      if (modalSetIsOpen) {
        setTimeout(() => modalSetIsOpen(true), MODAL_REOPEN_DELAY_MS);
      }
    });

    mediaUploader.on('close', () => {
      // Reopen modal if media library was closed without selection
      if (modalSetIsOpen) {
        setTimeout(() => modalSetIsOpen(true), MODAL_REOPEN_DELAY_MS);
      }
    });

    mediaUploader.open();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onFileSelect(null);
  };

  const handleResetConfirm = () => {
    onReset();
    setIsResetModalOpen(false);
  };

  if (mode === 'preview') {
    return (
      <div className={cn('wpchat:relative wpchat:h-16 wpchat:w-16', previewClassName)}>
        <Button
          variant='noStyle'
          className={cn(
            'wpchat:border-gray-300 wpchat:bg-gray-50 wpchat:relative wpchat:h-full wpchat:w-full wpchat:items-center wpchat:justify-center wpchat:rounded-lg wpchat:border wpchat:shadow-none',
            !previewUrl && 'wpchat:border-dashed',
            previewUrl && 'wpchat:border-none',
            className
          )}
          onPress={handleMediaUpload}
        >
          {previewUrl && (
            <img
              src={previewUrl}
              alt='Uploaded'
              className='wpchat:absolute wpchat:inset-0 wpchat:h-full wpchat:w-full wpchat:rounded-lg wpchat:object-cover'
            />
          )}
          {!previewUrl && (
            <SvgLoader
              name='addPhotoAlternate'
              className='wpchat:h-[1.5em] wpchat:w-[1.5em]'
            />
          )}
        </Button>
        {previewUrl && (
          <button
            className='wpchat:bg-red-100 wpchat:border-gray-300 wpchat:absolute wpchat:top-[-10px] wpchat:end-[-10px] wpchat:cursor-pointer wpchat:rounded-full wpchat:p-0.5'
            onClick={handleRemove}
          >
            <SvgLoader name='close' className='wpchat:h-4 wpchat:w-4 wpchat:fill-red-700' />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className='wpchat:flex wpchat:gap-2'>
        <Button
          variant='secondary'
          className={cn('wpchat:[&_svg]:fill-gray-900', className)}
          onPress={handleMediaUpload}
        >
          <SvgLoader name='uploadFile' />
          {__('Upload', 'smashballoon-wpchat-livechat-customer-support')}
        </Button>
        {onReset && (
          <Button
            variant='secondary'
            className='wpchat:[&_svg]:fill-gray-900'
            onPress={() => setIsResetModalOpen(true)}
          >
            <SvgLoader name='rotate' />
            {__('Reset', 'smashballoon-wpchat-livechat-customer-support')}
          </Button>
        )}
      </div>
      <Modal isOpen={isResetModalOpen} onOpenChange={setIsResetModalOpen} isDismissable>
        <Dialog>
          <DefaultModal
            variant='simple'
            title={__('Reset profile picture', 'smashballoon-wpchat-livechat-customer-support')}
            setIsOpen={setIsResetModalOpen}
            button={
              <Button onPress={handleResetConfirm}>
                {__('Reset', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
            }
          >
            {__('This will reset your profile picture to default. Are you sure you want to continue?', 'smashballoon-wpchat-livechat-customer-support')}
          </DefaultModal>
        </Dialog>
      </Modal>
    </>
  );
}
