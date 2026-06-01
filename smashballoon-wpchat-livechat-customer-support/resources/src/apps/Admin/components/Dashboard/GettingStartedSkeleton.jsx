import React from 'react';
import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';

const SkeletonBlock = ({ className }) => (
  <div
    className={`wpchat:animate-pulse wpchat:rounded wpchat:bg-gray-200 ${className}`}
    aria-hidden='true'
  />
);

export default function GettingStartedSkeleton() {
  return (
    <>
      <HeaderSkeleton />

      <div className='wpchat:mx-auto wpchat:max-w-[900px] wpchat:px-4 wpchat:py-5 wpchat:md:py-14'>
        {/* Hero section */}
        <div className='wpchat:mx-auto wpchat:mb-13 wpchat:max-w-[360px] wpchat:text-center'>
          <SkeletonBlock className='wpchat:mx-auto wpchat:h-8 wpchat:w-72 wpchat:mb-2.5' />
          <SkeletonBlock className='wpchat:h-4 wpchat:w-full wpchat:mb-2' />
          <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6 wpchat:mb-8' />
          <SkeletonBlock className='wpchat:mx-auto wpchat:h-10 wpchat:w-full wpchat:max-w-[327px] wpchat:rounded' />
        </div>

        {/* Video section */}
        <div className='wpchat:relative wpchat:mx-auto wpchat:mb-15 wpchat:max-w-[565px] wpchat:md:mb-15'>
          <div className='wpchat:absolute wpchat:top-[-30px] wpchat:end-[-90px] wpchat:hidden wpchat:md:block'>
            <SkeletonBlock className='wpchat:h-12 wpchat:w-12 wpchat:rounded' />
          </div>
          <SkeletonBlock className='wpchat:h-72 wpchat:w-full wpchat:rounded' />
        </div>

        {/* Separator */}
        <SkeletonBlock className='wpchat:h-px wpchat:w-full wpchat:mb-9' />

        {/* Getting started section title */}
        <SkeletonBlock className='wpchat:h-6 wpchat:w-48 wpchat:mb-3' />

        {/* Step 1 */}
        <div className='wpchat:mb-8 wpchat:grid wpchat:grid-cols-1 wpchat:gap-6 wpchat:md:grid-cols-2 wpchat:items-center'>
          <div className='wpchat:space-y-3'>
            <div className='wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:mb-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-full' />
              <SkeletonBlock className='wpchat:h-6 wpchat:w-48' />
            </div>
            <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
          </div>
          <div className='wpchat:flex wpchat:justify-center'>
            <SkeletonBlock className='wpchat:h-48 wpchat:w-64 wpchat:rounded' />
          </div>
        </div>

        {/* Step 2 */}
        <div className='wpchat:mb-8 wpchat:grid wpchat:grid-cols-1 wpchat:gap-6 wpchat:md:grid-cols-2 wpchat:items-center'>
          <div className='wpchat:space-y-3 wpchat:order-2 wpchat:md:order-1'>
            <div className='wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:mb-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-full' />
              <SkeletonBlock className='wpchat:h-6 wpchat:w-48' />
            </div>
            <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
          </div>
          <div className='wpchat:flex wpchat:justify-center wpchat:order-1 wpchat:md:order-2'>
            <SkeletonBlock className='wpchat:h-48 wpchat:w-64 wpchat:rounded' />
          </div>
        </div>

        {/* Step 3 */}
        <div className='wpchat:mb-8 wpchat:grid wpchat:grid-cols-1 wpchat:gap-6 wpchat:md:grid-cols-2 wpchat:items-center'>
          <div className='wpchat:space-y-3'>
            <div className='wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:mb-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-full' />
              <SkeletonBlock className='wpchat:h-6 wpchat:w-48' />
            </div>
            <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
          </div>
          <div className='wpchat:flex wpchat:justify-center'>
            <SkeletonBlock className='wpchat:h-48 wpchat:w-64 wpchat:rounded' />
          </div>
        </div>
      </div>
    </>
  );
}