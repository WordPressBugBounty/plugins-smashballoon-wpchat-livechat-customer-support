import React from 'react';
import SkeletonBlock from '@AC/Skeleton/SkeletonBlock';
import Card from '@AC/Card';
import AnalyticsSkeleton from './AnalyticsSkeleton';

const AnalyticsCardSkeleton = () => {
  return (
    <Card className="wpchat:flex-1 wpchat:flex wpchat:justify-between wpchat:flex-nowrap wpchat:gap-1 wpchat:mb-0 wpchat:flex-col wpchat:py-3 wpchat:ps-4 wpchat:pe-8 wpchat:relative">
      <div className="wpchat:flex wpchat:items-center wpchat:justify-between wpchat:gap-2 wpchat:flex-nowrap">
        <div className="wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:whitespace-nowrap wpchat:text-ellipsis wpchat:overflow-hidden">
          <SkeletonBlock className="wpchat:w-3 wpchat:h-3 wpchat:shrink-0" />
          <SkeletonBlock className="wpchat:h-[13px] wpchat:w-24" />
        </div>
      </div>
      <SkeletonBlock className="wpchat:text-lg wpchat:h-6 wpchat:w-8 wpchat:ms-5 wpchat:leading-relaxed" />
    </Card>
  );
};

const AnalyticsOverviewSkeleton = () => {
  return (
    <>
      <div className="wpchat:grid wpchat:grid-cols-1 wpchat:md:grid-cols-3 wpchat:gap-2.5 wpchat:mb-2.5">
        <AnalyticsCardSkeleton />
        <AnalyticsCardSkeleton />
        <AnalyticsCardSkeleton />
      </div>
       <AnalyticsSkeleton showHeader={true}/>
    </>
  );
};

export default AnalyticsOverviewSkeleton;
