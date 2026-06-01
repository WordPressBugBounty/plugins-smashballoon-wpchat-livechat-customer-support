import React from 'react';
import { ToggleButton as RACToggleButton, composeRenderProps } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { focusRing } from './utils';

let styles = tv({
  extend: focusRing,
  base: 'wpchat:border-gray-200 wpchat:text-gray-900 wpchat:text-md wpchat:cursor-pointer wpchat:rounded-sm wpchat:border wpchat:bg-white wpchat:px-2.5 wpchat:py-2 wpchat:text-center wpchat:font-semibold wpchat:shadow-sm wpchat:transition',
  variants: {
    isSelected: {
      false: '',
      true: 'wpchat:border-wp-light-blue-500',
    },
    isDisabled: {
      true: 'wpchat:opacity-5',
    },
  },
});

export function ToggleButton(props) {
  return (
    <RACToggleButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({ ...renderProps, className }),
      )}
    />
  );
}
