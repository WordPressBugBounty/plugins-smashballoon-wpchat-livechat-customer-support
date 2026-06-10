import React from 'react';
import { __ } from '@wordpress/i18n';
import { isValidPhoneNumber } from 'react-phone-number-input';
import ContentTooltip from '@AC/ContentTooltip';
import LoadingSpinnerIcon from '@Assets/svg/loading-spinner.svg?react';
import SvgLoader from '@Components/SvgLoader';
import { isValidInstagram, isValidTelegram, isValidMessenger } from '@Utils/validation';

/**
 * Reusable validation status component for platform fields
 * Shows verifying, success, or error states with icons and messages
 */
export const ValidationStatus = ({ status, message }) => {
  if (!status || !message) return null;

  const statusConfig = {
    verifying: {
      icon: <LoadingSpinnerIcon className='wpchat:w-4 wpchat:h-4 wpchat:animate-spin wpchat:shrink-0' />,
      textColor: 'wpchat:text-gray-500'
    },
    success: {
      icon: <SvgLoader name='circleCheck' className='wpchat:w-4 wpchat:h-4 wpchat:fill-green-700 wpchat:shrink-0' />,
      textColor: 'wpchat:text-green-700'
    },
    error: {
      icon: <SvgLoader name='warning' className='wpchat:h-4 wpchat:w-4 wpchat:fill-red-700 wpchat:shrink-0' />,
      textColor: 'wpchat:text-red-700'
    }
  };

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <div className='wpchat:flex wpchat:items-center wpchat:gap-1.5 wpchat:px-1 wpchat:py-0'>
      <div className='wpchat:flex wpchat:items-center wpchat:py-0.5'>{config.icon}</div>
      <p className={`wpchat:text-xs wpchat:leading-[1.6] ${config.textColor} wpchat:font-normal wpchat:my-0 wpchat:w-full`}>
        {message}
      </p>
    </div>
  );
};

/**
 * Helper function to render instruction text with <b> tags styled
 * Converts <b>text</b> to styled bold spans
 */
const renderInstruction = (text) => {
  if (typeof text !== 'string') return text;

  // Split by <b> tags and render with styling
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return parts.map((part, i) => {
    const match = part.match(/<b>(.*?)<\/b>/);
    if (match) {
      return (
        <strong key={i} className='wpchat:font-semibold wpchat:text-gray-700'>
          {match[1]}
        </strong>
      );
    }
    return part;
  });
};

/**
 * Help tooltip content component showing platform-specific instructions
 */
export const HelpTooltipContent = ({ platform }) => (
  <div>
    <div className='wpchat:p-5'>
      <h4 className='wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900 wpchat:m-0 wpchat:mb-3'>
        {platform.helpTitle}
      </h4>
      {platform.helpInstructions && (
        <ol className='wpchat:m-0 wpchat:ml-0 wpchat:pl-0 wpchat:list-none wpchat:flex wpchat:flex-col wpchat:gap-3'>
          {platform.helpInstructions.map((instruction, index) => (
            <li key={index} className='wpchat:flex wpchat:gap-2.5 wpchat:items-start'>
              <span className='wpchat:w-5 wpchat:h-5 wpchat:rounded-full wpchat:bg-gray-100 wpchat:flex wpchat:items-center wpchat:justify-center wpchat:shrink-0 wpchat:text-xs wpchat:font-semibold wpchat:text-gray-700'>
                {index + 1}
              </span>
              <span className='wpchat:text-[13px] wpchat:text-gray-700 wpchat:leading-[1.6]'>
                {renderInstruction(instruction)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
    {platform.helpFooter && (
      <div className='wpchat:flex wpchat:gap-3 wpchat:items-start wpchat:px-4 wpchat:pt-3 wpchat:pb-4 wpchat:bg-gray-50 wpchat:border-t wpchat:border-gray-200'>
        <div className='wpchat:flex wpchat:items-center wpchat:py-0.5 wpchat:shrink-0'>
          <SvgLoader name='informationCircle' className='wpchat:w-4 wpchat:h-4' />
        </div>
        <div className='wpchat:flex wpchat:flex-col wpchat:gap-1'>
          <p className='wpchat:text-[13px] wpchat:font-semibold wpchat:text-gray-900 wpchat:m-0 wpchat:leading-[1.6]'>
            {platform.helpFooter}
          </p>
          <p className='wpchat:text-[13px] wpchat:text-gray-700 wpchat:m-0 wpchat:leading-[1.6]'>{platform.helpFooterText}</p>
        </div>
      </div>
    )}
  </div>
);

/**
 * Help icon with tooltip wrapper component
 */
export const PlatformHelpTooltip = ({ helpConfig }) => {
  if (!helpConfig) return null;

  return (
    <div className='wpchat:flex wpchat:items-center wpchat:h-[42px] wpchat:shrink-0'>
      <ContentTooltip
        placement='auto'
        className='wpchat:min-w-[280px] wpchat:max-w-[320px] wpchat:p-0'
        content={<HelpTooltipContent platform={helpConfig} />}
        showArrow={true}
      >
        <div className='wpchat:relative wpchat:flex wpchat:items-center wpchat:group'>
          <button
            type='button'
            className='wpchat:w-7 wpchat:h-7 wpchat:p-1 wpchat:cursor-help wpchat:relative wpchat:rounded-md wpchat:group-hover:bg-wp-blue-50 wpchat:transition-colors'
            aria-label={helpConfig.helpTitle}
          >
            <SvgLoader name='questionMarkCircle' className='wpchat:w-full wpchat:h-full wpchat:fill-gray-500 wpchat:group-hover:fill-wp-blue-500' />
          </button>
        </div>
      </ContentTooltip>
    </div>
  );
};

/**
 * Validate platform value based on platform type
 * @param {string} slug - Platform slug (whatsapp, instagram, telegram, messenger)
 * @param {string} value - Value to validate
 * @returns {boolean} - Is value valid
 */
export const validatePlatformValue = (slug, value) => {
  if (!value) return false;
  const trimmedValue = value.trim();
  if (!trimmedValue) return false;

  switch (slug) {
    case 'whatsapp':
    case 'sms':
    case 'phone':
      return isValidPhoneNumber(trimmedValue);
    case 'instagram':
      return isValidInstagram(trimmedValue);
    case 'telegram':
      return isValidTelegram(trimmedValue);
    case 'messenger':
      return isValidMessenger(trimmedValue);
    default:
      return false;
  }
};

/**
 * Get validation status and message for a platform field
 * @param {Object} params - Validation parameters
 * @param {boolean} params.isVerifying - Is validation in progress
 * @param {boolean} params.isValid - Is the value valid
 * @param {string} params.value - Current field value
 * @param {boolean} params.hasInteracted - Has user interacted with field
 * @param {string} params.platformType - Platform type (phone, username, etc)
 * @returns {Object} - { status, message }
 */
export const getValidationState = ({
  isVerifying,
  isValid,
  value,
  hasInteracted,
  platformType = 'username'
}) => {
  if (isVerifying) {
    return {
      status: 'verifying',
      message: __('Verifying...', 'smashballoon-wpchat-livechat-customer-support')
    };
  }

  if (hasInteracted && value) {
    if (isValid) {
      return {
        status: 'success',
        message: platformType === 'phone'
          ? __('Phone number is valid', 'smashballoon-wpchat-livechat-customer-support')
          : __('Username is valid', 'smashballoon-wpchat-livechat-customer-support')
      };
    } else {
      return {
        status: 'error',
        message: platformType === 'phone'
          ? __('Phone number is not valid', 'smashballoon-wpchat-livechat-customer-support')
          : __('Please enter a valid username', 'smashballoon-wpchat-livechat-customer-support')
      };
    }
  }

  return { status: null, message: '' };
};
