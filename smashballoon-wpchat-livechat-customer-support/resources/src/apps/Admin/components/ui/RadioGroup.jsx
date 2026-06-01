import React from 'react';
import { Radio as RACRadio, RadioGroup as RACRadioGroup } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Description, FieldError, Label } from './Field';
import { composeTailwindRenderProps, focusRing } from './utils';

export function RadioGroup(props) {
  return (
    <RACRadioGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:group wpchat:flex wpchat:flex-col wpchat:gap-2',
      )}
    >
      <Label>{props.label}</Label>
      <div className='group-orientation-vertical:wpchat:flex-col group-orientation-horizontal:wpchat:gap-4 wpchat:flex wpchat:gap-2'>
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  );
}

const styles = tv({
  extend: focusRing,
  base: 'wpchat:h-5 wpchat:w-5 wpchat:rounded-full wpchat:border-2 wpchat:bg-white wpchat:transition-all',
  variants: {
    isSelected: {
      false: 'group-pressed:wpchat:border-gray-500 wpchat:border-gray-400',
      true: 'forced-colors:wpchat:border-[Highlight]! group-pressed:wpchat:border-gray-800 wpchat:border-[7px] wpchat:border-gray-700',
    },
    isInvalid: {
      true: 'group-pressed:wpchat:border-red-800 forced-colors:wpchat:border-[Mark]! wpchat:border-red-700',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:border-[GrayText]! wpchat:border-gray-200',
    },
  },
});

export function Radio(props) {
  return (
    <RACRadio
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:group disabled:wpchat:text-gray-300 forced-colors:wpchat:disabled wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:text-sm wpchat:text-gray-800 wpchat:transition',
      )}
    >
      {(renderProps) => (
        <>
          <div className={styles(renderProps)} />
          {props.children}
        </>
      )}
    </RACRadio>
  );
}
