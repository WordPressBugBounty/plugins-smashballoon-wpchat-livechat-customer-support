import React from 'react';
import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableHeader as AriaTableHeader,
  Button,
  Collection,
  Group,
  ResizableTableContainer,
  composeRenderProps,
  useTableOptions,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { cn } from '@Utils/cn';
import { Checkbox } from './Checkbox';
import { composeTailwindRenderProps, focusRing } from './utils';

export function Table(props) {
  return (
    <ResizableTableContainer className='wpchat:relative wpchat:scroll-pt-[2.281rem] wpchat:border wpchat:border-gray-200 wpchat:overflow-visible'>
      <AriaTable {...props} className='wpchat:border-collapse wpchat:border-spacing-0 wpchat:w-full' />
    </ResizableTableContainer>
  );
}

const columnStyles = tv({
  extend: focusRing,
  base: 'wpchat:flex wpchat:h-9 wpchat:flex-1 wpchat:items-center wpchat:gap-1 wpchat:overflow-hidden wpchat:px-5',
});

export function Column(props) {
  return (
    <AriaColumn
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:cursor-default wpchat:text-start wpchat:focus-within:z-20 wpchat:[&:hover]:z-20',
      )}
    >
      {composeRenderProps(props.children, (children, { allowsSorting, sortDirection }) => (
        <div className='wpchat:flex wpchat:items-center'>
          <Group role='presentation' tabIndex={-1} className={columnStyles}>
            <span className='wpchat:text-gray-700 wpchat:truncate wpchat:text-sm wpchat:font-normal'>
              {children}
            </span>
            {allowsSorting && (
              <span
                className={`wpchat:flex wpchat:h-4 wpchat:w-4 wpchat:items-center wpchat:justify-center wpchat:transition ${
                  sortDirection === 'descending' ? 'wpchat:rotate-180' : ''
                }`}
              ></span>
            )}
          </Group>
        </div>
      ))}
    </AriaColumn>
  );
}

export function TableHeader(props) {
  let { selectionBehavior, selectionMode, allowsDragging } = useTableOptions();

  return (
    <AriaTableHeader
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'forced-colors:wpchat:bg-[Canvas] wpchat:sticky wpchat:top-0 wpchat:z-10 wpchat:rounded-t-lg wpchat:bg-white',
      )}
    >
      {allowsDragging && <Column />}
      {selectionBehavior === 'toggle' && (
        <AriaColumn
          width={36}
          minWidth={36}
          className='wpchat:cursor-default wpchat:py-2.5 wpchat:pe-4 wpchat:ps-5 wpchat:text-start'
        >
          {selectionMode === 'multiple' && <Checkbox slot='selection' />}
        </AriaColumn>
      )}
      <Collection items={props.columns}>{props.children}</Collection>
    </AriaTableHeader>
  );
}

const rowStyles = tv({
  extend: focusRing,
  base: 'wpchat:group/row wpchat:selected:bg-blue-100 wpchat:selected:hover:bg-blue-200 wpchat:relative wpchat:cursor-default wpchat:text-sm wpchat:text-gray-900 wpchat:select-none wpchat:hover:bg-gray-100 wpchat:disabled:text-gray-300',
});

export function Row({ id, columns, children, className, ...otherProps }) {
  let { selectionBehavior, allowsDragging } = useTableOptions();

  return (
    <AriaRow id={id} {...otherProps} className={cn(rowStyles, className)}>
      {allowsDragging && (
        <Cell className='wpchat:ps-5'>
          <Button slot='drag'>≡</Button>
        </Cell>
      )}
      {selectionBehavior === 'toggle' && (
        <Cell className='wpchat:py-5 wpchat:ps-5'>
          <Checkbox slot='selection' />
        </Cell>
      )}
      <Collection items={columns}>{children}</Collection>
    </AriaRow>
  );
}

const cellStyles = tv({
  extend: focusRing,
  base: 'wpchat:group-selected/row:border-(--selected-border) wpchat:truncate wpchat:p-2',
});

export function Cell(props) {
  return <AriaCell {...props} className={cn(cellStyles, props.className)} />;
}
