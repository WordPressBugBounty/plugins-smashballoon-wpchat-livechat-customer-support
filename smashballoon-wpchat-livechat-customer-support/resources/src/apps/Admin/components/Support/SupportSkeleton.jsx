import React from 'react';
import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

export default function SupportSkeleton() {
  const SupportCardSkeleton = () => (
    <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
      <div className='wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:mb-4'>
        <SkeletonBlock className='wpchat:h-6 wpchat:w-6 wpchat:rounded' />
        <SkeletonBlock className='wpchat:h-6 wpchat:w-32' />
      </div>
      
      <SkeletonBlock className='wpchat:h-4 wpchat:w-full wpchat:mb-6' />
      
      <div className='wpchat:space-y-3 wpchat:mb-6'>
        <SkeletonBlock className='wpchat:h-4 wpchat:w-full' />
        <SkeletonBlock className='wpchat:h-4 wpchat:w-5/6' />
        <SkeletonBlock className='wpchat:h-4 wpchat:w-4/5' />
      </div>
      
      <SkeletonBlock className='wpchat:h-4 wpchat:w-28' />
    </div>
  );

  const NeedHelpSkeleton = () => (
    <div className='wpchat:mb-3 wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
      <div className='wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:mb-4'>
        <SkeletonBlock className='wpchat:h-8 wpchat:w-8 wpchat:rounded-full' />
        <SkeletonBlock className='wpchat:h-6 wpchat:w-24' />
      </div>
      
      <SkeletonBlock className='wpchat:h-4 wpchat:w-full wpchat:mb-2' />
      <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4 wpchat:mb-6' />
      
      <div className='wpchat:flex wpchat:gap-3'>
        <SkeletonBlock className='wpchat:h-10 wpchat:w-32 wpchat:rounded' />
        <SkeletonBlock className='wpchat:h-10 wpchat:w-28 wpchat:rounded' />
      </div>
    </div>
  );

  const SystemInfoSkeleton = () => (
    <div className='wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
      <SkeletonBlock className='wpchat:h-6 wpchat:w-32 wpchat:mb-4' />
      
      <div className='wpchat:grid wpchat:grid-cols-1 wpchat:md:grid-cols-2 wpchat:gap-4'>
        {[...Array(6)].map((_, index) => (
          <div key={index} className='wpchat:flex wpchat:justify-between wpchat:items-center'>
            <SkeletonBlock className='wpchat:h-4 wpchat:w-24' />
            <SkeletonBlock className='wpchat:h-4 wpchat:w-16' />
          </div>
        ))}
      </div>
      
      <div className='wpchat:mt-6 wpchat:pt-4 wpchat:border-t wpchat:border-gray-200'>
        <SkeletonBlock className='wpchat:h-10 wpchat:w-full wpchat:rounded' />
      </div>
    </div>
  );

  return (
    <div>
      <HeaderSkeleton />
      
      <div className='wpchat:mx-auto wpchat:max-w-[906px] wpchat:px-4 wpchat:py-5 wpchat:md:py-14'>
        <div className='wpchat:mb-7 wpchat:grid wpchat:gap-3 wpchat:md:grid-cols-3'>
          {[...Array(3)].map((index) => (
            <SupportCardSkeleton key={index} />
          ))}
        </div>
        
        <NeedHelpSkeleton />
        <SystemInfoSkeleton />
      </div>
    </div>
  );
}