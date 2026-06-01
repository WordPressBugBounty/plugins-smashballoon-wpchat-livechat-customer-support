import React from 'react';
import { ColorSwatch as AriaColorSwatch } from 'react-aria-components';
import { getGlobalLightnessAndChroma } from '@Utils/getGlobalLightnessAndChroma';
import { composeTailwindRenderProps } from './utils';

export function ColorSwatch(props) {
  const currentColor = getGlobalLightnessAndChroma();

  return (
    <AriaColorSwatch
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:h-5 wpchat:w-5 wpchat:cursor-pointer wpchat:rounded-full wpchat:border wpchat:border-black/10',
      )}
      style={({ color }) => {
        return {
          background: `oklch(${currentColor.lightness} ${currentColor.chroma} ${color?.hue})`,
        };
      }}
    />
  );
}
