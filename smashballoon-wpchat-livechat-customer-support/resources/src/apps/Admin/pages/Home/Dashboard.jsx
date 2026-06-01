import React, { Suspense, lazy } from 'react';
import { __ } from '@wordpress/i18n';
import DashboardSkeleton from '@AC/Dashboard/DashboardSkeleton';
import ProLicenseNotice from '@AC/ProLicenseNotice';

// Lazy load heavy components to improve initial load time
const PageLayout = lazy(() => import('@AC/PageLayout'));
const FeatureCards = lazy(() => import('@AC/Dashboard/FeatureCards'));
const OverviewCard = lazy(() => import('@AC/Dashboard/OverviewCard'));
const AnalyticsDashboard = lazy(() => import('@AC/Analytics/AnalyticsDashboard'));

/**
 * Dashboard component serves as the main interface for displaying
 * user-specific data, statistics, or tools within the application.
 *
 * @component
 * @returns {JSX.Element} The rendered Dashboard component.
 */
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageLayout
        breadcrumb={[{ label: __('Dashboard', 'smashballoon-wpchat-livechat-customer-support') }]}
        className='wpchat:max-w-[900px] wpchat:px-4 wpchat:md:pt-6'
        disableHelpBtn={true}
      >
        <ProLicenseNotice />
        <OverviewCard />
        <FeatureCards />
          <Suspense>
            <AnalyticsDashboard />
          </Suspense>
      </PageLayout>
    </Suspense>
  );
}
