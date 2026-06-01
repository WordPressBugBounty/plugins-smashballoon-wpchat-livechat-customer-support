import React from 'react';

export default function ChatSkeleton() {
  return (
    <div className='wpchat:animate-pulse wpchat:space-y-4 wpchat:py-2'>
      <div className='wpchat:relative wpchat:min-h-[48px] wpchat:w-full wpchat:pe-3 wpchat:ps-[60px]'>
        <div className='wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:h-[48px] wpchat:w-[48px] wpchat:rounded-full wpchat:bg-gray-200' />
        <div className='wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:ps-3 wpchat:mb-2'>
          <div className='wpchat:h-3.5 wpchat:w-16 wpchat:rounded wpchat:bg-gray-200' />
          <div className='wpchat:h-3 wpchat:w-10 wpchat:rounded wpchat:bg-gray-100' />
        </div>
        <div className='wpchat:rounded-2xl wpchat:bg-gray-100 wpchat:px-4 wpchat:py-3'>
          <div className='wpchat:mb-2 wpchat:h-4 wpchat:w-full wpchat:rounded wpchat:bg-gray-200' />
          <div className='wpchat:h-4 wpchat:w-3/4 wpchat:rounded wpchat:bg-gray-200' />
        </div>
      </div>
      <div className='wpchat:ps-[60px] wpchat:flex wpchat:gap-2'>
        <div className='wpchat:h-8 wpchat:w-24 wpchat:rounded-2xl wpchat:bg-gray-100' />
        <div className='wpchat:h-8 wpchat:w-20 wpchat:rounded-2xl wpchat:bg-gray-100' />
      </div>
    </div>
  );
}
