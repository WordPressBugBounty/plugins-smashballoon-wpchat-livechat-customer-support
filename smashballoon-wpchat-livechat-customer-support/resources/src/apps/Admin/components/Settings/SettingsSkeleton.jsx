import React from 'react';
import HeaderSkeleton from '@AC/Skeleton/HeaderSkeleton';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

export default function SettingsSkeleton() {
  const LicenseCardSkeleton = () => (
    <div className='wpchat:mb-6 wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
      <div className='wpchat:mb-6'>
        <div className='wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:mb-2'>
          <SkeletonBlock className='wpchat:h-6 wpchat:w-32' />
          <SkeletonBlock className='wpchat:h-5 wpchat:w-16 wpchat:rounded-full' />
        </div>
        <SkeletonBlock className='wpchat:h-4 wpchat:w-full wpchat:mb-2' />
        <SkeletonBlock className='wpchat:h-4 wpchat:w-3/4' />
      </div>

      <div className='wpchat:flex wpchat:flex-wrap wpchat:items-start wpchat:gap-1.5 wpchat:pb-8'>
        <div className='wpchat:min-w-[200px] wpchat:flex-1'>
          <SkeletonBlock className='wpchat:h-10 wpchat:w-full wpchat:rounded' />
        </div>
        <div className='wpchat:w-[100%] wpchat:flex-shrink-0 wpchat:md:w-auto'>
          <SkeletonBlock className='wpchat:h-10 wpchat:w-24 wpchat:rounded' />
        </div>
        <div className='wpchat:w-[100%] wpchat:flex-shrink-0 wpchat:md:w-auto'>
          <SkeletonBlock className='wpchat:h-10 wpchat:w-32 wpchat:rounded' />
        </div>
      </div>

      <div className='wpchat:-mx-6 wpchat:-mb-6 wpchat:flex wpchat:border-t wpchat:border-gray-200'>
        <SkeletonBlock className='wpchat:h-12 wpchat:w-1/2' />
        <SkeletonBlock className='wpchat:h-12 wpchat:w-1/2' />
      </div>
    </div>
  );

  const SettingsCardSkeleton = ({ titleWidth = 'w-48', descWidth = 'w-full', hasButton = false, hasToggle = false }) => (
    <div className='wpchat:mb-6 wpchat:rounded-lg wpchat:bg-white wpchat:p-6 wpchat:shadow-sm'>
      <div className='wpchat:flex wpchat:justify-between wpchat:items-start'>
        <div className='wpchat:flex-1'>
          <SkeletonBlock className={`wpchat:h-6 wpchat:${titleWidth} wpchat:mb-2`} />
          <SkeletonBlock className={`wpchat:h-4 wpchat:${descWidth}`} />
        </div>
        {hasToggle && <SkeletonBlock className='wpchat:h-6 wpchat:w-12 wpchat:rounded-full' />}
        {hasButton && <SkeletonBlock className='wpchat:h-10 wpchat:w-20 wpchat:rounded' />}
      </div>
    </div>
  );

  return (
    <div>
      <HeaderSkeleton />
      
      <div className='wpchat:mx-auto wpchat:max-w-[752px] wpchat:px-4 wpchat:py-5 wpchat:md:py-14'>
        <LicenseCardSkeleton />
        
        <SettingsCardSkeleton 
          titleWidth='w-64' 
          descWidth='w-full' 
          hasToggle={true} 
        />
        
        <SettingsCardSkeleton 
          titleWidth='w-32' 
          descWidth='w-3/4' 
          hasButton={true} 
        />
        
        <SettingsCardSkeleton 
          titleWidth='w-40' 
          descWidth='w-2/3' 
          hasButton={true} 
        />
      </div>
    </div>
  );
}