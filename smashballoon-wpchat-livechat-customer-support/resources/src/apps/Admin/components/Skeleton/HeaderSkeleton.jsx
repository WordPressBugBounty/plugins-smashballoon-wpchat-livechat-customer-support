import React from 'react';
import HeaderLayout from '@AC/HeaderLayout';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

/**
 * Header skeleton component - mimics the structure of the Header component
 * Used as a common skeleton for all pages while loading
 *
 * @returns {JSX.Element} The rendered HeaderSkeleton component
 */
export default function HeaderSkeleton() {
  return (
    <HeaderLayout>
      <div className='wpchat:flex wpchat:items-center wpchat:gap-1 wpchat:md:gap-x-5'>
        {/* Left Section - Logo and Breadcrumb */}
        <div className='wpchat:flex wpchat:w-[50%] wpchat:items-center wpchat:justify-start'>
          {/* Logo skeleton */}
          <SkeletonBlock className='wpchat:h-6 wpchat:w-6 wpchat:rounded' />

          {/* Breadcrumb skeleton */}
          <div className='wpchat:flex wpchat:items-center wpchat:ps-3 wpchat:md:ps-5'>
            <SkeletonBlock className='wpchat:h-5 wpchat:w-20' />
          </div>
        </div>

        {/* Right Section - Action buttons */}
        <div className='wpchat:flex wpchat:w-[50%] wpchat:items-center wpchat:justify-end wpchat:md:w-[50%]'>
          {/* Action buttons skeleton */}
          <div className='wpchat:flex wpchat:gap-2'>
            <SkeletonBlock className='wpchat:h-9 wpchat:w-24' />
            <SkeletonBlock className='wpchat:h-9 wpchat:w-16' />
          </div>
        </div>
      </div>
    </HeaderLayout>
  );
}
