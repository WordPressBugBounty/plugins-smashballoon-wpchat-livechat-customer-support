import React from 'react';
import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

export default function VisibilitySkeleton() {
  const VisibilityTabsSkeleton = () => (
    <div className='wpchat:flex wpchat:flex-col wpchat:flex-wrap'>
      <div className='wpchat:mb-8 wpchat:grid wpchat:gap-2.5 wpchat:md:mb-7.5 wpchat:md:grid-cols-2'>
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className='wpchat:relative wpchat:rounded-lg wpchat:border wpchat:border-gray-200 wpchat:bg-white wpchat:py-5 wpchat:pe-5 wpchat:ps-13 wpchat:shadow-md'
          >
            <SkeletonBlock className='wpchat:absolute wpchat:top-6 wpchat:start-5 wpchat:h-4 wpchat:w-4 wpchat:rounded-full' />
            <SkeletonBlock className='wpchat:h-5 wpchat:w-48 wpchat:mb-2' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <HeaderSkeleton />
      
      <div className='wpchat:mx-auto wpchat:max-w-3xl wpchat:px-4 wpchat:py-5 wpchat:md:py-14'>
        <VisibilityTabsSkeleton />
      </div>
    </div>
  );
}