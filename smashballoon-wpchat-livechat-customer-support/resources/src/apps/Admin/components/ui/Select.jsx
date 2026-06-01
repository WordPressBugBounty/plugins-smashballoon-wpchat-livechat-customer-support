import React from 'react';
import { Select as AriaSelect, Button, ListBox, SelectValue } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { Description, FieldError, Label } from './Field';
import { DropdownItem, DropdownSection } from './ListBox';
import { Popover } from './Popover';
import { composeTailwindRenderProps, focusRing } from './utils';

const styles = tv({
  extend: focusRing,
  base: 'wpchat:flex wpchat:min-w-[125px] wpchat:cursor-default wpchat:items-center wpchat:gap-4 wpchat:rounded-sm wpchat:border wpchat:border-black/10 wpchat:py-2 wpchat:pe-2 wpchat:ps-3 wpchat:text-start wpchat:transition',
  variants: {
    isDisabled: {
      false: '',
      true: '',
    },
  },
});

export function Select({
  label,
  description,
  errorMessage,
  children,
  items,
  btnClassName,
  ...props
}) {
  return (
    <AriaSelect
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:group wpchat:flex wpchat:flex-wrap',
      )}
    >
      {label && <Label className='wpchat:w-full'>{label}</Label>}
      <Button className={cn(styles(), btnClassName)}>
        <SelectValue className='placeholder-shown:wpchat:italic wpchat:flex-1 wpchat:text-sm' />
        <SvgLoader
          name='chevronDown'
          aria-hidden
          className='wpchat:w-4 wpchat:h-4'
        />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className='min-w-(--trigger-width)'>
        <ListBox
          items={items}
          className='wpchat:max-h-[300px] wpchat:overflow-auto'
        >
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SelectItem(props) {
  return <DropdownItem {...props} />;
}

export function SelectSection(props) {
  return <DropdownSection {...props} />;
}
