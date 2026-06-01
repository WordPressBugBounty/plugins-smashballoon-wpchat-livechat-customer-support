import React from 'react';
import {
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import SvgLoader from '@Components/SvgLoader';
import { Description, FieldError, Label } from './Field';
import { composeTailwindRenderProps, focusRing } from './utils';
import { cn } from '@Utils/cn';

/**
 * CheckboxGroup component renders a group of checkboxes with a label,
 * optional description, and error message.
 *
 * @component
 * @param {Object} props - Props for CheckboxGroup.
 * @param {string} [props.label] - The label for the checkbox group.
 * @param {string} [props.description] - A short description shown below the group.
 * @param {string} [props.errorMessage] - Error message shown when validation fails.
 * @param {React.ReactNode} props.children - Checkbox elements to display in the group.
 * @returns {JSX.Element} The rendered checkbox group.
 */
export function CheckboxGroup(props) {
  return (
    <AriaCheckboxGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:flex wpchat:flex-col wpchat:gap-2',
      )}
    >
      <Label>{props.label}</Label>
      {props.children}
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </AriaCheckboxGroup>
  );
}

const checkboxStyles = tv({
  base: 'wpchat:group wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:text-sm wpchat:transition',
  variants: {
    isDisabled: {
      false: 'wpchat:text-gray-800',
      true: 'wpchat:text-gray-300 wpchat:forced-colors:text-[GrayText]',
    },
  },
});

const boxStyles = tv({
  extend: focusRing,
  base: 'wpchat:flex wpchat:h-5 wpchat:w-5 wpchat:shrink-0 wpchat:items-center wpchat:justify-center wpchat:rounded-sm wpchat:border-2 wpchat:transition',
  variants: {
    variant: {
      default: '',
      solid: 'wpchat:[&_svg]:fill-white',
    },
    isSelected: {
      true: '',
      false: '',
    },
    isInvalid: {
      true: 'wpchat:border-red-700',
    },
    isDisabled: {
      true: 'wpchat:bg-gray-200 wpchat:border-gray-200',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      isSelected: false,
      className: 'wpchat:bg-white wpchat:border-gray-500',
    },
    {
      variant: 'default',
      isSelected: true,
      className: 'wpchat:bg-[--color] wpchat:border-[--color] wpchat:group-pressed:[--color:var(--color-gray-800)]',
    },
    {
      variant: 'solid',
      isSelected: false,
      className: 'wpchat:bg-white wpchat:border-gray-300',
    },
    {
      variant: 'solid',
      isSelected: true,
      className: 'wpchat:bg-wp-light-blue-500 wpchat:border-wp-light-blue-500',
    },
  ],
  defaultVariants: {
    variant: 'default',
  },
});

const iconStyles =
  'wpchat:w-4 wpchat:h-4 wpchat:text-white wpchat:group-disabled:text-gray-400 wpchat:forced-colors:text-[HighlightText] wpchat:fill-gray-500';

/**
 * Reusable checkbox component with support for visual variants.
 *
 * @component
 * @param {Object} props - Props for the Checkbox component.
 * @param {string} [props.variant='default'] - Visual style of the checkbox ('default', 'solid', etc.).
 * @param {React.ReactNode} [props.children] - Label or content to display next to the checkbox.
 * @param {string} [props.className] - Additional CSS classes for the checkbox wrapper.
 * @param {...Object} props - Additional props are passed directly to the underlying checkbox element.
 *
 * @returns {JSX.Element} The rendered Checkbox component.
 */
export function Checkbox({ variant = 'default', ...props }) {
  return (

    <AriaCheckbox
      {...props}
      className={composeTailwindRenderProps(
        cn('wpchat:cursor-pointer', props.className),
        (className, renderProps) => checkboxStyles({ ...renderProps, className }),
      )}
    >
      {({ isSelected, isIndeterminate, ...renderProps }) => (
        <>
          <div
            className={boxStyles({
              variant,
              isSelected: isSelected || isIndeterminate,
              ...renderProps,
            })}
          >
            {isIndeterminate ? (
              <SvgLoader name="minus" aria-hidden className={iconStyles} />
            ) : isSelected ? (
              <SvgLoader name="check" aria-hidden className={iconStyles} />
            ) : null}
          </div>
          {props.children}
        </>
      )}
    </AriaCheckbox>
  );
}