import React from 'react';
import { __ } from '@wordpress/i18n';
import AgentStats from './AgentStats';
import AnalyticsOverview from './AnalyticsOverview';
import FrequentQuestions from './FrequentQuestions';

const AnalyticsDashboard = () => {
  return (
    <>
      <AnalyticsOverview />
      <FrequentQuestions />
      <AgentStats />
    </>
  );
};

export default AnalyticsDashboard;
