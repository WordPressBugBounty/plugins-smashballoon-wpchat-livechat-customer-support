import React from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { Badge } from '@AC/ui/Badge';
import { Button } from '@AC/ui/Button';

/**
 * A lightweight modal to promote Pro features during onboarding.
 * Expects parent to render the overlay/backdrop and handle close.
 */
const ProFeaturesModal = ({ features = [], onPrimary, onSecondary, onClose }) => {
  return (
    <div className='wpchat:relative wpchat:w-[min(620px,92vw)] wpchat:rounded-lg wpchat:bg-white wpchat:shadow-lg wpchat:overflow-hidden'>
      {/* Header */}
      <div className='wpchat:border-b wpchat:border-gray-200 wpchat:px-6 wpchat:py-5'>
        <h2 className='wpchat:m-0 wpchat:text-lg wpchat:leading-snug wpchat:font-semibold wpchat:text-gray-900'>
          {__('Would you like to purchase and install all the pro features?', 'smashballoon-wpchat-livechat-customer-support')}
        </h2>
      </div>

      {/* Body */}

      {features.map((f, idx) => (
        <div
          key={idx}
          className={`wpchat:flex wpchat:items-start wpchat:justify-between wpchat:py-5 wpchat:px-8 ${idx % 2 === 1 ? 'wpchat:bg-gray-50' : ''}`}
        >
          <div className='wpchat:flex wpchat:items-start wpchat:gap-4'>
            <div className='wpchat:mt-1'>
              <SvgLoader name={f.icon} className='wpchat:w-5 wpchat:h-5 wpchat:text-gray-500' />
            </div>
            <div>
              <div className='wpchat:flex wpchat:items-center wpchat:gap-2'>
                <div className='wpchat:text-gray-900 wpchat:text-base wpchat:font-semibold'>{f.name}</div>
                {f.pro && (
                  <Badge className='wpchat:bg-wp-blue-50 wpchat:rounded-xl wpchat:px-1.5 wpchat:py-0.5 wpchat:text-xs'>
                    {__('Pro', 'smashballoon-wpchat-livechat-customer-support')}
                  </Badge>
                )}
              </div>
              <div className='wpchat:text-gray-700 wpchat:text-sm'>{f.desc}</div>
            </div>
          </div>
        </div>
      ))}


      {/* Footer */}
      <div className='wpchat:flex wpchat:items-center wpchat:justify-end wpchat:gap-3 wpchat:border-t wpchat:border-gray-200 wpchat:bg-white wpchat:px-6 wpchat:py-4'>
        <Button
          variant='secondary'
          onPress={onSecondary}
          className='wpchat:px-3 wpchat:py-2 wpchat:justify-center'
        >
          {__('I\'ll do it later', 'smashballoon-wpchat-livechat-customer-support')}
        </Button>
        <Button
          variant='primary'
          onPress={onPrimary}
          className='wpchat:px-3 wpchat:py-2 wpchat:justify-center wpchat:bg-green-600 hover:wpchat:bg-green-700'
        >
          {__('Purchase and Install Now', 'smashballoon-wpchat-livechat-customer-support')}
          <SvgLoader name='chevronRight' className='wpchat:h-[1.1em] wpchat:w-[1.1em] wpchat:rtl:rotate-180' />
        </Button>
      </div>

      {/* Close button */} 
      <button
        type='button'
        className='wpchat:absolute wpchat:top-3 wpchat:end-3 wpchat:bg-transparent wpchat:p-0 wpchat:border-0 wpchat:cursor-pointer'
        aria-label={__('Close', 'smashballoon-wpchat-livechat-customer-support')}
        onClick={onClose}
      >
        <SvgLoader name='close' className='wpchat:w-6 wpchat:h-6 wpchat:fill-gray-500' />
      </button>
    </div>
  );
};

export default ProFeaturesModal;


