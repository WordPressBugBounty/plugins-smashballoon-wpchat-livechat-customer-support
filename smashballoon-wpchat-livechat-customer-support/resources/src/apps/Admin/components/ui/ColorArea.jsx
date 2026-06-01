import React from 'react';
import { ColorArea as AriaColorArea } from 'react-aria-components';
import { ColorThumb } from './ColorThumb';
import { composeTailwindRenderProps } from './utils';

export function ColorArea(props) {
  return (
    <AriaColorArea
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'forced-colors:wpchat:bg-[GrayText] wpchat:h-56 wpchat:w-56 wpchat:rounded-lg wpchat:bg-gray-300',
      )}
      style={({ defaultStyle, isDisabled }) => ({
        ...defaultStyle,
        background: isDisabled ? undefined : defaultStyle.background,
      })}
    >
      <ColorThumb />
    </AriaColorArea>
  );
}
