import React from 'react';
import { ColorField as AriaColorField } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Description, FieldError, Input, Label, fieldBorderStyles } from './Field';
import { composeTailwindRenderProps, focusRing } from './utils';

const inputStyles = tv({
  extend: focusRing,
  base: 'wpchat:rounded-md wpchat:border-2',
  variants: {
    ...fieldBorderStyles.variants,
  },
});

export function ColorField({ label, description, errorMessage, ...props }) {
  return (
    <AriaColorField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:flex wpchat:flex-col wpchat:gap-1',
      )}
    >
      {label && <Label>{label}</Label>}
      <Input className={inputStyles} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaColorField>
  );
}
