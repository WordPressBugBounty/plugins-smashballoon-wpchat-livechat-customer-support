import React from 'react';
import { ColorSlider as AriaColorSlider, SliderOutput, SliderTrack } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { ColorThumb } from './ColorThumb';
import { Label } from './Field';
import { composeTailwindRenderProps } from './utils';

const trackStyles = tv({
  base: 'wpchat:group wpchat:orientation-horizontal:h-6 wpchat:col-span-2 wpchat:rounded-lg',
  variants: {
    orientation: {
      horizontal: 'wpchat:h-6 wpchat:w-full',
      vertical: 'wpchat:ms-[50%] wpchat:h-56 wpchat:w-6 wpchat:-translate-x-[50%]',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:bg-[GrayText] wpchat:bg-gray-300',
    },
  },
});

export function ColorSlider({ label, ...props }) {
  return (
    <AriaColorSlider
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:orientation-horizontal:grid wpchat:orientation-vertical:flex wpchat:orientation-horizontal:w-56 wpchat:grid-cols-[1fr_auto] wpchat:flex-col wpchat:items-center wpchat:gap-2',
      )}
    >
      <Label>{label}</Label>
      <SliderOutput className='wpchat:orientation-vertical:hidden wpchat:text-sm wpchat:font-medium wpchat:text-gray-500' />
      <SliderTrack
        className={trackStyles}
        style={({ defaultStyle, isDisabled }) => ({
          ...defaultStyle,
          background: isDisabled
            ? undefined
            : `${defaultStyle.background}, repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
        })}
      >
        <ColorThumb />
      </SliderTrack>
    </AriaColorSlider>
  );
}
