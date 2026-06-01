import React, { Suspense, lazy } from 'react';
import GettingStarted from '@AP/Home/GettingStarted';
import { getLocalizeVariables } from '@Utils/getLocalizeVariables';

const Dashboard = lazy(() => import('@AP/Home/Dashboard'));

/**
 * Home component serves as the main landing page of the application.
 * Typically includes an overview, introductory content, or navigation to key sections.
 *
 * @component
 * @returns {JSX.Element} The rendered Home component.
 */
export default function Home() {
  if (getLocalizeVariables('onboardingStatus')) {
    return (
      <Suspense>
        <Dashboard />
      </Suspense>
    );
  }

  return <GettingStarted />;
}
