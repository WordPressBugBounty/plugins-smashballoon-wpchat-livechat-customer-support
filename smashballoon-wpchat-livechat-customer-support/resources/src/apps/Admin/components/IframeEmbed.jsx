import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { __ } from '@wordpress/i18n';

/**
 * IframeEmbed component displays an image thumbnail and, when clicked, replaces it with an iframe.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.imageSrc - Source URL of the image thumbnail.
 * @param {string} props.iframeSrc - Source URL of the iframe to display.
 * @param {string} [props.className] - Additional CSS classes for styling the component.
 *
 * @returns {JSX.Element} The rendered IframeEmbed component.
 */

const IframeEmbed = ({ imageSrc, iframeSrc, className }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      className={twMerge('wpchat:relative wpchat:h-0 wpchat:w-full wpchat:pb-[56.25%]', className)}
    >
      {!isPlaying ? (
        <button
          type='button'
          aria-label={__('Play video', 'smashballoon-wpchat-livechat-customer-support')}
          onClick={() => setIsPlaying(true)}
          className='wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:m-0 wpchat:h-full wpchat:w-full wpchat:cursor-pointer wpchat:border-0 wpchat:bg-transparent wpchat:p-0'
        >
          <img
            src={imageSrc}
            alt=''
            className='wpchat:h-full wpchat:w-full wpchat:rounded-lg wpchat:object-cover'
          />
        </button>
      ) : (
        <iframe
          src={iframeSrc}
          title={__('Video', 'smashballoon-wpchat-livechat-customer-support')}
          className='wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:h-full wpchat:w-full'
          allow='autoplay'
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

export default IframeEmbed;
