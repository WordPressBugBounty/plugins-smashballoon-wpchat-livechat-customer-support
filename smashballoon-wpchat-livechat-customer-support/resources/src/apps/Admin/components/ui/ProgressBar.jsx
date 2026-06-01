import React from 'react';
import { ProgressBar as AriaProgressBar } from 'react-aria-components';
import { Label } from './Field';
import { composeTailwindRenderProps } from './utils';

export function ProgressBar({ label, ...props }) {
  return (
    <AriaProgressBar
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'wpchat:flex wpchat:flex-col wpchat:gap-1',
      )}
    >
      {({ percentage, valueText, isIndeterminate, showValueLabel = false }) => (
        <>
          <div className='wpchat:flex wpchat:justify-between wpchat:gap-2'>
            {label && <Label>{label}</Label>}
            {valueText && showValueLabel && (
              <span className='wpchat:text-sm wpchat:text-gray-600'>
                {valueText}
              </span>
            )}
          </div>
          <div className='wpchat:relative wpchat:h-2 wpchat:overflow-hidden wpchat:rounded-full wpchat:bg-gray-200 wpchat:outline wpchat:outline-1 wpchat:-outline-offset-1 wpchat:outline-transparent wpchat:w-full'>
            <div
              className={`wpchat:bg-wp-blue-500 forced-colors:wpchat:bg-[Highlight] wpchat:absolute wpchat:top-0 wpchat:h-full wpchat:rounded-full ${
                isIndeterminate
                  ? 'wpchat:animate-in wpchat:slide-in-from-start-[20rem] wpchat:repeat-infinite wpchat:start-full wpchat:duration-1000 wpchat:ease-out'
                  : 'wpchat:start-0'
              }`}
              style={{ width: (isIndeterminate ? 40 : percentage) + '%' }}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}
