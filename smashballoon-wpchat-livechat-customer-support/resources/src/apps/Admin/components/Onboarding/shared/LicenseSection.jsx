import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import { TextField } from '@AC/ui/TextField';
import SvgLoader from '@Components/SvgLoader';
import { isPro } from '@Utils/isPro';
import UpgradeProgress from '../../UpgradeProgress';

export default function LicenseSection({
  title = __('Activate your Pro Plugin', 'smashballoon-wpchat-livechat-customer-support'),
  description = __(
    'Activate your plugin by adding a license key',
    'smashballoon-wpchat-livechat-customer-support',
  ),
  licenseKey,
  getLicenseKeyDisplayValue,
  updateField,
  isActive,
  isActivating,
  isDeactivating,
  isLoading,
  isUpgrading,
  upgradeProgress,
  licenseError,
  onActivate,
  getLicenseButtonLabel,
  showHelpSection = true,
  variant = 'pro', // 'pro' or 'free'
}) {
  return (
    <>
      <div
        className={`wpchat:md:px-10.5 wpchat:px-5 wpchat:py-6 ${variant === 'free' ? 'wpchat:rounded-b-lg wpchat:border-t wpchat:border-gray-200 wpchat:bg-gray-50' : ''}`}
      >
        <h4
          className={`wpchat:m-0 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900 ${variant === 'free' ? 'wpchat:text-center' : ''}`}
        >
          {title}
        </h4>
        <p
          className={`wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-500 ${variant === 'free' ? 'wpchat:text-center' : ''}`}
        >
          {description}
        </p>

        <div
          className={`wpchat:flex wpchat:flex-wrap wpchat:items-start wpchat:gap-3 wpchat:pt-5 ${variant === 'free' ? 'wpchat:justify-center' : ''}`}
        >
          <TextField
            aria-label={__('License key', 'smashballoon-wpchat-livechat-customer-support')}
            placeholder={__('Paste license key here', 'smashballoon-wpchat-livechat-customer-support')}
            inputClassName='wpchat:w-full'
            className={isPro ? 'wpchat:md:max-w-[380px]' : 'wpchat:md:max-w-[310px]'}
            type='text'
            value={getLicenseKeyDisplayValue()}
            onChange={(value) => updateField('licenseKey', value)}
            isDisabled={isActivating || isDeactivating || isLoading || isUpgrading || isActive}
            variant={isActive ? 'success' : licenseError ? 'error' : ''}
            errorMessage={licenseError}
            isInvalid={!!licenseError}
            icon={
              isActivating || isDeactivating || isUpgrading
                ? 'cloud'
                : isActive
                  ? 'check'
                  : licenseError
                    ? 'warning'
                    : ''
            }
          />
          <Button
            variant="primary"
            className="wpchat:w-full wpchat:md:w-auto"
            onPress={onActivate}
            isDisabled={
              isActivating || isDeactivating || isLoading || isUpgrading || (!isActive && !licenseKey?.trim())
            }
          >
            {!isActivating && !isDeactivating && !isUpgrading && !isActive && (
              <SvgLoader name='check' className='wpchat:h-[1.2em] wpchat:w-[1.2em]' />
            )}
            {getLicenseButtonLabel()}
          </Button>
        </div>

        {/* Upgrade Progress */}
        {isUpgrading && (
          <div className="wpchat:mt-4">
            <UpgradeProgress
              isActive={isUpgrading}
              realProgress={upgradeProgress}
            />
          </div>
        )}
      </div>

      {/* Help row (Pro only) */}
      {showHelpSection && isPro && (
        <div className='wpchat:rounded-b-lg wpchat:border-t wpchat:border-gray-200 wpchat:bg-gray-50'>
          <div className='wpchat:flex wpchat:items-start wpchat:gap-3 wpchat:p-6'>
            <SvgLoader
              name='informationCircle'
              className='wpchat:fill-grey-800 wpchat:mt-0.5 wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:flex-shrink-0'
            />
            <div className='wpchat:max-w-[465px]'>
              <h6 className='wpchat:m-0 wpchat:mb-1.5 wpchat:text-xs wpchat:leading-relaxed wpchat:font-semibold'>
                {__(
                  "Can't find your License key or don't have one?",
                  'smashballoon-wpchat-livechat-customer-support',
                )}
              </h6>
              <div className='wpchat:mt-2'>
                <p className='wpchat:m-0 wpchat:text-xs wpchat:text-gray-800'>
                  {__('You can ', 'smashballoon-wpchat-livechat-customer-support')}
                  <a
                    href={window.wpChatAdmin?.accountUrl || '#'}
                    className='wpchat:underline wpchat:hover:text-gray-800'
                    target='_blank'
                    rel='noreferrer'
                  >
                    {__('Log in', 'smashballoon-wpchat-livechat-customer-support')}
                  </a>
                  {__(
                    ' to WPChat Dashboard and find your license key. If you do not have a key, you can ',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}
                  <a
                    href={window.wpChatAdmin?.upgradeUrl || '#'}
                    className='wpchat:underline wpchat:hover:text-gray-800'
                    target='_blank'
                    rel='noreferrer'
                  >
                    {__('purchase WPChat', 'smashballoon-wpchat-livechat-customer-support')}
                  </a>
                  {__(' to get one.', 'smashballoon-wpchat-livechat-customer-support')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
