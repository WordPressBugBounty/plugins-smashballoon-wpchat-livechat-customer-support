import React from 'react';
import {
  ToggleButtonGroup as RACToggleButtonGroup,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

const styles = tv({
  base: 'wpchat:flex wpchat:gap-1',
  variants: {
    orientation: {
      horizontal: 'wpchat:flex-row',
      vertical: 'wpchat:flex-col',
    },
  },
});

export function ToggleButtonGroup(props) {
  return (
    <RACToggleButtonGroup
      {...props}
      className={composeRenderProps(props.className, (className) =>
        styles({ orientation: props.orientation || 'horizontal', className }),
      )}
    />
  );
}
