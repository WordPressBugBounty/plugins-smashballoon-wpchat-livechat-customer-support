import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import SvgLoader from '@Components/SvgLoader';
import { ValidationStatus, PlatformHelpTooltip } from './PlatformValidation';
import { cn } from '@Utils/cn';

/**
 * Helper function to get border class based on validation status and focus state
 * Uses Tailwind color classes from the color mapping in CLAUDE.md
 * Border colors show when field has error/success status OR when focused
 */
const getBorderClass = (status, isFocused) => {
  if (status === 'error') return 'wpchat:border-red-700';
  if (status === 'success') return 'wpchat:border-green-700';
  if (isFocused) return 'wpchat:border-gray-400';
  return 'wpchat:border-gray-200';
};

/**
 * Simple reusable component for platform input field row
 * Used in both SupportChannels and AgentCreateEdit
 */
export default function PlatformFieldRow({
  platform,
  value,
  onChange,
  onBlur,
  validationStatus,
  validationMessage,
  isLast = false,
  borderBottom = true,
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Early return if platform is null or undefined
  if (!platform) {
    return null;
  }

  const isPhone = platform.inputType === 'phone';
  const PlatformIcon = platform.icon;
  const borderClass = getBorderClass(validationStatus, isFocused);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  return (
      <div
        className={cn(
          'wpchat:flex wpchat:flex-col wpchat:sm:flex-row wpchat:gap-3 wpchat:items-center wpchat:px-0 wpchat:py-2.5 wpchat:w-full',
          !isLast && borderBottom && 'wpchat:border-b wpchat:border-gray-200',
        )}
      >
      {/* Platform Icon and Label */}
      <div className='wpchat:flex wpchat:w-full wpchat:sm:flex-1 wpchat:gap-3 wpchat:items-center wpchat:md:py-3'>
        {PlatformIcon ? (
          <div className='wpchat:w-5 wpchat:h-5 wpchat:shrink-0'>
            <PlatformIcon className='wpchat:w-full wpchat:h-full' />
          </div>
        ) : (
          <SvgLoader name={platform.slug + 'Color'} className='wpchat:w-5 wpchat:h-5 wpchat:shrink-0' />
        )}
        <p className='wpchat:text-sm wpchat:leading-[1.6] wpchat:text-gray-900 wpchat:font-normal wpchat:my-0'>
          {platform.name || platform.label}
        </p>
      </div>

      {/* Input Field */}
      <div className='wpchat:flex wpchat:w-full wpchat:sm:flex-1 wpchat:flex-col wpchat:gap-1 wpchat:items-start'>
        {isPhone ? (
          <PhoneInput
            international
            defaultCountry='US'
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={platform.placeholder}
            className={cn(
              'wpchat:w-full wpchat:bg-white wpchat:border wpchat:rounded-lg wpchat:shadow-[0px_1px_2px_0px_#3c425712] wpchat:overflow-hidden wpchat:min-w-0 wpchat:h-[42px]',
              borderClass
            )}
          />
        ) : (
          <div className={cn(
            'wpchat:w-full wpchat:bg-white wpchat:border wpchat:rounded-lg wpchat:shadow-[0px_1px_2px_0px_#3c425712] wpchat:flex wpchat:items-center wpchat:overflow-hidden wpchat:h-[42px]',
            borderClass
          )}>
            {platform.prefix && (
              <div className='wpchat:border-r wpchat:border-gray-200 wpchat:flex wpchat:h-full wpchat:items-center wpchat:px-3 wpchat:py-0 wpchat:shrink-0'>
                <p className='wpchat:text-sm wpchat:leading-[1.6] wpchat:text-gray-700 wpchat:font-normal wpchat:my-0 wpchat:whitespace-nowrap'>
                  {platform.prefix}
                </p>
              </div>
            )}
            <div className='wpchat:flex wpchat:flex-1 wpchat:items-center wpchat:px-4 wpchat:py-2.5 wpchat:min-w-0'>
              <input
                type='text'
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={platform.placeholder}
                className='wpchat:w-full wpchat:text-sm wpchat:leading-[1.6] wpchat:text-gray-900 wpchat:font-normal wpchat:bg-transparent wpchat:border-none wpchat:outline-none placeholder:wpchat:text-gray-500 wpchat:focus:outline-none wpchat:focus:ring-0 wpchat:min-w-0'
              />
            </div>
          </div>
        )}
        <ValidationStatus status={validationStatus} message={validationMessage} />
      </div>

      {/* Help Icon - Hidden on mobile, shown on larger screens */}
      <div className='wpchat:hidden wpchat:md:flex wpchat:self-baseline'>
        <PlatformHelpTooltip helpConfig={platform.helpConfig || platform} />
      </div>
    </div>
  );
}
