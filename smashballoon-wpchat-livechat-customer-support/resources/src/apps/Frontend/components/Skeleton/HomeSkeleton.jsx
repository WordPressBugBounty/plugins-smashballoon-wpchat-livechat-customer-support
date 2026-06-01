import React from 'react';

export default function HomeSkeleton() {
  return (
    <div className='wpchat:animate-pulse'>
      {/* Header heading */}
      <div className='wpchat:mb-2 wpchat:h-9 wpchat:w-3/4 wpchat:rounded wpchat:bg-widget-bg-2' />
      {/* Send Message card */}
      <div className='wpchat:relative wpchat:mb-3 wpchat:rounded-lg wpchat:bg-widget-card-bg wpchat:p-5 wpchat:shadow-md'>
        <div className='wpchat:mb-5 wpchat:flex wpchat:gap-3'>
          <div className='wpchat:h-[22px] wpchat:w-[22px] wpchat:rounded-full wpchat:bg-widget-bg-2' />
          <div className='wpchat:h-[22px] wpchat:w-[22px] wpchat:rounded-full wpchat:bg-widget-bg-2' />
          <div className='wpchat:h-[22px] wpchat:w-[22px] wpchat:rounded-full wpchat:bg-widget-bg-2' />
        </div>
        <div className='wpchat:mb-2 wpchat:h-5 wpchat:w-2/3 wpchat:rounded wpchat:bg-widget-bg-2' />
        <div className='wpchat:h-4 wpchat:w-4/5 wpchat:rounded wpchat:bg-widget-bg-2' />
        <div className='wpchat:absolute wpchat:top-1/2 wpchat:end-3 wpchat:h-8 wpchat:w-8 wpchat:-translate-y-1/2 wpchat:rounded wpchat:bg-widget-bg-2' />
      </div>
      {/* FAQ card */}
      <div className='wpchat:rounded-lg wpchat:bg-widget-card-bg wpchat:p-5 wpchat:shadow-md'>
        <div className='wpchat:mb-3 wpchat:h-4 wpchat:w-1/3 wpchat:rounded wpchat:bg-widget-bg-2' />
        <div className='wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:border-b wpchat:border-widget-border wpchat:py-3'>
          <div className='wpchat:h-3 wpchat:w-3 wpchat:rounded wpchat:bg-widget-bg-2' />
          <div className='wpchat:h-4 wpchat:w-4/5 wpchat:rounded wpchat:bg-widget-bg-2' />
        </div>
        <div className='wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:border-b wpchat:border-widget-border wpchat:py-3'>
          <div className='wpchat:h-3 wpchat:w-3 wpchat:rounded wpchat:bg-widget-bg-2' />
          <div className='wpchat:h-4 wpchat:w-3/5 wpchat:rounded wpchat:bg-widget-bg-2' />
        </div>
        <div className='wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:py-3'>
          <div className='wpchat:h-3 wpchat:w-3 wpchat:rounded wpchat:bg-widget-bg-2' />
          <div className='wpchat:h-4 wpchat:w-3/4 wpchat:rounded wpchat:bg-widget-bg-2' />
        </div>
      </div>
    </div>
  );
}
