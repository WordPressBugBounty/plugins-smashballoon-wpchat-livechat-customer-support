import React from 'react';
import {
  Group,
  FieldError as RACFieldError,
  Input as RACInput,
  Label as RACLabel,
  TextArea as RACTextarea,
  Text,
  composeRenderProps,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps, focusRing } from './utils';

export const fieldBorderStyles = tv({
  variants: {
    isFocusWithin: {
      false: 'forced-colors:wpchat:border-[ButtonBorder] wpchat:border-gray-200',
      true: 'forced-colors:wpchat:border-[Highlight] wpchat:border-gray-200',
    },
    isInvalid: {
      true: 'forced-colors:wpchat:border-[Mark] wpchat:text-red-700',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:border-[GrayText] wpchat:w-full wpchat:border-gray-200',
    },
  },
});

export const fieldGroupStyles = tv({
  extend: focusRing,
  base: 'wpchat:group wpchat:flex wpchat:h-9 wpchat:overflow-hidden',
  variants: fieldBorderStyles.variants,
});

export function Label(props) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        'wpchat:text-gray-700 wpchat:w-fit wpchat:cursor-default wpchat:text-sm wpchat:leading-relaxed wpchat:font-normal',
        props.className,
      )}
    />
  );
}

export function Description(props) {
  return (
    <Text
      {...props}
      slot='description'
      className={twMerge('wpchat:text-sm wpchat:text-gray-600', props.className)}
    />
  );
}

export function FieldError(props) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'forced-colors:wpchat:text-[Mark] wpchat:mt-1 wpchat:text-sm wpchat:text-red-600',
      )}
    />
  );
}

export function FieldGroup(props) {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({ ...renderProps, className }),
      )}
    />
  );
}

export function Input(props) {
  return <RACInput {...props} className={composeTailwindRenderProps(props.className)} />;
}

export function TextArea(props) {
  return (
    <RACTextarea
      {...props}
      className={composeTailwindRenderProps(props.className, 'wpchat:h-33 wpchat:resize-none')}
    />
  );
}
