import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useRTL } from '@Hooks/useRTL';

/**
 * ScrollableSection component provides a scrollable container for its children.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the scrollable section.
 *
 * @returns {JSX.Element} The rendered ScrollableSection component.
 */
export default function ScrollableSection({ children }) {
  const isRTL = useRTL();

  return (
    <ScrollArea.Root dir={isRTL ? 'rtl' : 'ltr'} className='wpchat:h-full wpchat:overflow-hidden'>
      <ScrollArea.Viewport className='wpchat-viewport wpchat:h-full wpchat:w-full'>
        <section className='wpchat:flex wpchat:flex-col wpchat:space-y-4'>{children}</section>
      </ScrollArea.Viewport>

      <ScrollArea.Scrollbar
        orientation='vertical'
        className='hover:wpchat:bg-gray-300 wpchat:w-2 wpchat:bg-transparent wpchat:transition-colors wpchat:duration-150 wpchat:ease-in-out'
      >
        <ScrollArea.Thumb className='wpchat:w-full wpchat:rounded-full wpchat:bg-gray-500' />
      </ScrollArea.Scrollbar>

      <ScrollArea.Scrollbar
        orientation='horizontal'
        className='hover:wpchat:bg-gray-300 wpchat:h-2 wpchat:bg-transparent wpchat:transition-colors wpchat:duration-150 wpchat:ease-in-out'
      >
        <ScrollArea.Thumb className='wpchat:h-full wpchat:rounded-full wpchat:bg-gray-500' />
      </ScrollArea.Scrollbar>

      <ScrollArea.Corner className='wpchat:bg-gray-300' />
    </ScrollArea.Root>
  );
}
