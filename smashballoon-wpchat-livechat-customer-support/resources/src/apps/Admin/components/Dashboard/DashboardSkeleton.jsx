import React from 'react';
import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';

// Inline skeleton component to avoid additional imports and improve loading speed
const SkeletonBlock = ({ className }) => (
  <div
    className={`wpchat:animate-pulse wpchat:rounded wpchat:bg-gray-200 ${className}`}
    aria-hidden='true'
  />
);

export default function DashboardSkeleton() {
  return (
    <>
      <HeaderSkeleton />

      <div className='wpchat:mx-auto wpchat:max-w-[900px] wpchat:px-4 wpchat:py-5 wpchat:md:py-14'>
        {/* Overview Card - matches OverviewCard.jsx exact structure */}
        <div className='wpchat:mb-4 wpchat:grid wpchat:grid-cols-1 wpchat:py-1.5 wpchat:pe-1.5 wpchat:md:grid-cols-2 wpchat:shadow-md wpchat:rounded-lg wpchat:bg-blue-50'>
          <div className='wpchat:relative wpchat:-mt-13 wpchat:h-[352px] wpchat:overflow-hidden wpchat:md:-me-11'>
          </div>
          <div className='wpchat:flex wpchat:w-full wpchat:items-center wpchat:rounded-md wpchat:bg-white wpchat:px-4 wpchat:pt-4 wpchat:pb-6 wpchat:md:px-10 wpchat:shadow-md'>
            <div className='wpchat:w-full'>
              <div className='wpchat:mb-5 wpchat:max-w-[300px]'>
                <SkeletonBlock className='wpchat:h-6 wpchat:w-48 wpchat:mb-2' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
              </div>
              <div className='wpchat:flex wpchat:gap-1.5'>
                <SkeletonBlock className='wpchat:h-10 wpchat:w-24 wpchat:rounded' />
                <SkeletonBlock className='wpchat:h-10 wpchat:w-20 wpchat:rounded' />
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards section */}
        <div className='wpchat:mb-8 wpchat:grid wpchat:grid-cols-1 wpchat:gap-4 wpchat:sm:grid-cols-2 wpchat:lg:grid-cols-4'>
          <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
            <div className='wpchat:space-y-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
              <SkeletonBlock className='wpchat:h-5 wpchat:w-24' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4' />
            </div>
          </div>
          <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
            <div className='wpchat:space-y-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
              <SkeletonBlock className='wpchat:h-5 wpchat:w-24' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4' />
            </div>
          </div>
          <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
            <div className='wpchat:space-y-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
              <SkeletonBlock className='wpchat:h-5 wpchat:w-24' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4' />
            </div>
          </div>
          <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
            <div className='wpchat:space-y-3'>
              <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
              <SkeletonBlock className='wpchat:h-5 wpchat:w-24' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4' />
            </div>
          </div>
        </div>

        {/* Upgrade to Pro section */}
        <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
          <div className='wpchat:space-y-6'>
            {/* Header */}
            <div className='wpchat:space-y-3'>
              <SkeletonBlock className='wpchat:h-6 wpchat:w-64' />
              <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
              <div className='wpchat:flex wpchat:gap-3'>
                <SkeletonBlock className='wpchat:h-10 wpchat:w-32 wpchat:rounded' />
                <SkeletonBlock className='wpchat:h-10 wpchat:w-24 wpchat:rounded' />
              </div>
            </div>

            {/* Feature list */}
            <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-4 wpchat:md:grid-cols-3'>
              <div className='wpchat:space-y-3'>
                <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
                <SkeletonBlock className='wpchat:h-5 wpchat:w-32' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
              </div>
              <div className='wpchat:space-y-3'>
                <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
                <SkeletonBlock className='wpchat:h-5 wpchat:w-32' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
              </div>
              <div className='wpchat:space-y-3'>
                <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
                <SkeletonBlock className='wpchat:h-5 wpchat:w-32' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
                <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
