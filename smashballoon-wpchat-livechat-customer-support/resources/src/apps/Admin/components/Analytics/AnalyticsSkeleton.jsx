import React from 'react';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';

export const AnalyticsSkeleton = ({ showHeader = false }) => {
  return (
    <div className="wpchat:bg-white wpchat:rounded-xl wpchat:shadow-sm wpchat:mb-10">
      {/* Header skeleton */}
      {showHeader && (
        <div className="wpchat:border-b wpchat:border-gray-200 wpchat:py-3 wpchat:px-5">
          <SkeletonBlock className="wpchat:h-4 wpchat:w-40" />
        </div>
      )}

      {/* Content skeleton */}
      <div className="wpchat:p-8">
        <SkeletonBlock className="wpchat:h-[300px] wpchat:w-full" />
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
