import React from 'react';
import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

/**
 * Skeleton loader for the Agent page while data is loading
 * Uses the common HeaderSkeleton component
 *
 * @returns {JSX.Element} The rendered AgentSkeleton component
 */
export default function AgentSkeleton() {
  // Agent item skeleton
  const AgentItemSkeleton = () => (
    <div className='wpchat:mb-4 wpchat:rounded-lg wpchat:bg-white wpchat:p-4 wpchat:shadow-sm'>
      <div className='wpchat:flex wpchat:items-start wpchat:justify-between'>
        {/* Left side - Agent info */}
        <div className='wpchat:flex wpchat:flex-1 wpchat:gap-3'>
          <SkeletonBlock className='wpchat:h-6 wpchat:w-6 wpchat:rounded-full' />
          <div className='wpchat:flex-1 wpchat:space-y-2'>
            <SkeletonBlock className='wpchat:h-5 wpchat:w-32' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-48' />
            <SkeletonBlock className='wpchat:h-3 wpchat:w-24' />
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className='wpchat:flex wpchat:gap-2'>
          <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
          <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded' />
        </div>
      </div>
    </div>
  );


  return (
    <div>
      {/* Common Header Skeleton */}
      <HeaderSkeleton />

      {/* Main Content */}
      <div className='wpchat:mx-auto wpchat:max-w-3xl wpchat:px-4 wpchat:py-5 wpchat:md:py-14'>
        {/* Agent items skeleton */}
        <AgentItemSkeleton />

        {/* New Agent Info skeleton */}
        <div className='wpchat:mt-6 wpchat:rounded-lg wpchat:bg-white wpchat:p-4 wpchat:shadow-sm'>
          <div className='wpchat:space-y-3'>
            <SkeletonBlock className='wpchat:h-5 wpchat:w-40' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4' />
          </div>
        </div>
      </div>
    </div>
  );
}
