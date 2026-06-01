import React from 'react';
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Collection,
  Header,
  ListBoxSection,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import SvgLoader from '@Components/SvgLoader';
import { composeTailwindRenderProps, focusRing } from './utils';
import { isPro } from '@Utils/isPro';

export function ListBox({ children, ...props }) {
  return (
    <AriaListBox
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:border-gray-200 wpchat:rounded-lg wpchat:border wpchat:outline-0',
      )}
    >
      {children}
    </AriaListBox>
  );
}

export const itemStyles = tv({
  extend: focusRing,
  base: 'wpchat:group wpchat:relative wpchat:flex wpchat:cursor-default wpchat:items-center wpchat:gap-8 wpchat:rounded-md wpchat:px-2.5 wpchat:py-1.5 wpchat:text-sm wpchat:will-change-transform wpchat:forced-color-adjust-none wpchat:select-none',
  variants: {
    isSelected: {
      false: 'hover:wpchat:bg-slate-200 wpchat:text-slate-700',
      true: 'forced-colors:wpchat:bg-[Highlight] forced-colors:wpchat:text-[HighlightText] [&:wpchat:has(+[data-selected])] [&+[data-selected]]:wpchat:rounded-t-none forced-colors:wpchat:outline-[HighlightText] wpchat:bg-blue-600 wpchat:text-white wpchat:-outline-offset-4 wpchat:outline-white',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:text-[GrayText] wpchat:text-slate-300',
    },
  },
});

export function ListBoxItem(props) {
  let textValue =
    props.textValue || (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem {...props} textValue={textValue} className={itemStyles}>
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          <div className='absolute start-4 end-4 bottom-0 h-px bg-white/20 forced-colors:bg-[HighlightText] hidden [.group[data-selected]:has(+[data-selected])_&]:block' />
        </>
      ))}
    </AriaListBoxItem>
  );
}

export const dropdownItemStyles = tv({
  base: 'wpchat:group wpchat:text-gray-900 wpchat:flex wpchat:cursor-pointer wpchat:items-center wpchat:gap-2 wpchat:px-2 wpchat:py-3 wpchat:text-sm wpchat:leading-relaxed wpchat:forced-color-adjust-none wpchat:select-none',
  variants: {
    isDisabled: {
      false: 'wpchat: wpchat:text-gray-900',
      true: 'forced-colors:wpchat:text-[GrayText] wpchat:text-gray-300',
    },
    isFocused: {
      true: 'wpchat:bg-gray-50 forced-colors:wpchat:bg-[Highlight] forced-colors:wpchat:text-[HighlightText]',
    },
  },
  compoundVariants: [
    {
      isFocused: false,
      isOpen: true,
      className: 'wpchat: wpchat:bg-gray-100',
    },
  ],
});

export function DropdownItem(props) {
  let textValue =
    props.textValue || (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem {...props} textValue={textValue} className={dropdownItemStyles}>
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          <span className='group-selected:wpchat:font-semibold wpchat:flex wpchat:flex-1 wpchat:items-center wpchat:gap-2 wpchat:truncate wpchat:font-normal'>
            {children}
            {!isPro && props?.isPro && (
              <SvgLoader name='lockedBadgeText' className='wpchat:w-[3.5em] wpchat:h-[1.5em]' />
            )}
            {isSelected && props?.isSelectedCustom && (
              <span className='wpchat:bg-wp-blue-50 wpchat:text-wp-blue-500 wpchat:rounded-sm wpchat:px-1.5 wpchat:text-sm wpchat:leading-relaxed'>
                {props.isSelectedCustom}
              </span>
            )}
          </span>
          <span className='wpchat:flex wpchat:w-5 wpchat:items-center'>
            {isSelected && !props?.isSelectedCustom && (
              <SvgLoader name='check' className='wpchat:h-4 wpchat:w-4' />
            )}
          </span>
        </>
      ))}
    </AriaListBoxItem>
  );
}

export function DropdownSection(props) {
  return (
    <ListBoxSection className="first:wpchat:-mt-[5px] after:wpchat:content-[''wpchat:] after:wpchat:block after:wpchat:h-[5px]">
      <Header className='supports-[-moz-appearance:wpchat:none] [&+*]:wpchat:mt-1 wpchat:sticky wpchat:-top-[5px] wpchat:z-10 wpchat:-mx-1 wpchat:-mt-px wpchat:truncate wpchat:border-y wpchat:border-y-gray-200 wpchat:bg-gray-100/60 wpchat:px-4 wpchat:py-1 wpchat:text-sm wpchat:font-semibold wpchat:text-gray-500 wpchat:backdrop-blur-md'>
        {props.title}
      </Header>
      <Collection items={props.items}>{props.children}</Collection>
    </ListBoxSection>
  );
}
