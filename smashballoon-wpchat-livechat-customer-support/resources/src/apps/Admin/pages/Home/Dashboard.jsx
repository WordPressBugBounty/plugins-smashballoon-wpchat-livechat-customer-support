import React, { Suspense, lazy, useState } from 'react';
import { __ } from '@wordpress/i18n';
import DashboardSkeleton from '@AC/Dashboard/DashboardSkeleton';
import ProLicenseNotice from '@AC/ProLicenseNotice';
import NotificationStack from '@AC/NotificationStack';
import DataSharingConsentModal from '@AC/Dashboard/DataSharingConsentModal';
import useSettingsStore from '@DataStore/settings/settingsStore';
import useNotificationsStore from '@DataStore/notifications/notificationsStore';
import { getLocalizeVariables } from '@Utils/getLocalizeVariables';
import { isPro } from '@Utils/isPro';

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
  const { saveSettings } = useSettingsStore();

  const [showConsentModal, setShowConsentModal] = useState(() => {
    // wp_localize_script converts booleans to strings ("1"/""), so use truthy checks.
    // Pro never shows the consent modal — the gate is Free-only WP.org compliance.
    return (
      !isPro &&
      !!getLocalizeVariables('onboardingStatus') &&
      !getLocalizeVariables('dataSharingConsent') &&
      !getLocalizeVariables('dataSharingConsentDismissed')
    );
  });

  const handleAcceptConsent = async () => {
    try {
      await saveSettings({
        dataSharingConsent: true,
        notificationsEnabled: true,
      });
      window.wpChatAdmin.dataSharingConsent = true;
      window.wpChatAdmin.notificationsEnabled = true;
      window.dispatchEvent(new Event('wpchat:settings-updated'));
      useNotificationsStore.getState().refetch();
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
    setShowConsentModal(false);
  };

  const handleSkipConsent = async () => {
    try {
      await saveSettings({
        dataSharingConsentDismissed: true,
      });
      window.wpChatAdmin.dataSharingConsentDismissed = true;
    } catch (error) {
      console.error('Failed to save consent dismissal:', error);
    }
    setShowConsentModal(false);
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageLayout
        breadcrumb={[{ label: __('Dashboard', 'smashballoon-wpchat-livechat-customer-support') }]}
        className='wpchat:max-w-[900px] wpchat:px-4 wpchat:md:pt-6'
        disableHelpBtn={true}
      >
        <ProLicenseNotice />
        <NotificationStack />
        <OverviewCard />
        <FeatureCards />
          <Suspense>
            <AnalyticsDashboard />
          </Suspense>
      </PageLayout>

      <DataSharingConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptConsent}
        onSkip={handleSkipConsent}
      />
    </Suspense>
  );
}
