import React from 'react';
import { ColorThumb as AriaColorThumb } from 'react-aria-components';
import { tv } from 'tailwind-variants';

const thumbStyles = tv({
  base: 'wpchat:top-[50%] wpchat:start-[50%] wpchat:h-6 wpchat:w-6 wpchat:rounded-full wpchat:border-2 wpchat:border-white',
  variants: {
    isFocusVisible: {
      true: 'wpchat:h-8 wpchat:w-8',
    },
    isDragging: {
      true: 'forced-colors:wpchat:bg-[ButtonBorder] wpchat:bg-gray-700',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:border-[GrayText] forced-colors:wpchat:bg-[GrayText] wpchat:border-gray-300 wpchat:bg-gray-300',
    },
  },
});

export function ColorThumb(props) {
  return (
    <AriaColorThumb
      {...props}
      style={({ defaultStyle, isDisabled }) => ({
        ...defaultStyle,
        backgroundColor: isDisabled ? undefined : defaultStyle.backgroundColor,
        boxShadow: '0 0 0 1px black, inset 0 0 0 1px black',
      })}
      className={thumbStyles}
    />
  );
}
