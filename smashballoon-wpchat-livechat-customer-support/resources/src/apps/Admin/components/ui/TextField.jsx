import React from 'react';
import { TextField as AriaTextField } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { __, sprintf } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { Description, FieldError, Input, Label, TextArea, fieldBorderStyles } from './Field';
import { composeTailwindRenderProps, focusRing } from './utils';

const inputContainerStyles = tv({
  base: 'wpchat:relative wpchat:w-full',
  variants: {
    variant: {
      success: 'wpchat:[&_svg]:fill-green-600',
      error: 'wpchat:[&_svg]:fill-red-600',
    },
  },
});

const inputStyles = tv({
  extend: focusRing,
  base: 'wpchat:rounded-sm wpchat:border wpchat:border-gray-200 wpchat:px-4 wpchat:py-2 wpchat:text-sm wpchat:text-gray-900 wpchat:placeholder:text-gray-500',
  variants: {
    variant: {
      secondary: 'wpchat:px-3 wpchat:py-1.5 wpchat:text-xs',
      error: 'wpchat:border-red-600',
      success: 'wpchat:border-green-600',
    },
  },
});

export function TextField({
  label,
  description,
  errorMessage,
  inputClassName,
  maxLength,
  showMaxLength,
  as = 'input',
  value,
  variant = '',
  layout = 'vertical',
  icon = null,
  iconPosition = 'right',
  descriptionClassName = '',
  ...props
}) {
  const InputComponent = as === 'textarea' ? TextArea : Input;
  const characterCount = value ? value.length : 0;
  const isHorizontal = layout === 'horizontal';
  const isIconRight = iconPosition === 'right';

  return (
    <AriaTextField
      {...props}
      maxLength={maxLength}
      value={value}
      className={composeTailwindRenderProps(
        props.className,
        cn(
          'wpchat:flex',
          isHorizontal
            ? 'wpchat:flex-row wpchat:items-center wpchat:gap-2'
            : 'wpchat:w-full wpchat:flex-col wpchat:gap-1',
        ),
      )}
    >
      {label && (
        <Label className={isHorizontal ? 'wpchat:w-[24%] wpchat:text-xs' : ''}>{label}</Label>
      )}
      <div className={inputContainerStyles({ variant })}>
        {icon && (
          <>
            <div
              className={cn(
                'wpchat:absolute wpchat:top-[1px] wpchat:h-[95%] wpchat:w-[1px] wpchat:bg-gray-200',
                isIconRight ? 'wpchat:end-10' : 'wpchat:start-10',
              )}
            ></div>
            <div
              className={cn(
                'wpchat:pointer-events-none wpchat:absolute wpchat:top-1/2 wpchat:-translate-y-1/2 wpchat:border-e-gray-200',
                isIconRight ? 'wpchat:end-3' : 'wpchat:start-3',
              )}
            >
              <SvgLoader
                name={icon}
                className='wpchat:h-4 wpchat:w-4 wpchat:text-gray-500'
                aria-hidden='true'
              />
            </div>
          </>
        )}

        <InputComponent
          className={cn(
            inputStyles({ variant }),
            icon && (isIconRight ? 'wpchat:pe-11' : 'wpchat:ps-11'),
            isHorizontal && 'wpchat:w-full',
            inputClassName,
          )}
        />
      </div>
      {showMaxLength && maxLength && (
        <Description
          className={cn(
            'wpchat:inline-block wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-700',
            descriptionClassName,
          )}
        >
          {sprintf(
            __('%1$d/%2$d characters', 'smashballoon-wpchat-livechat-customer-support'),
            characterCount,
            maxLength,
          )}
        </Description>
      )}
      {description && <Description>{description}</Description>}
      <FieldError className='wpchat:block wpchat:text-red-700'>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
