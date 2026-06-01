import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import useAnalyticsStore from '@DataStore/analytics/analyticsStore';
import SvgLoader from '@Components/SvgLoader';
import Card from '@AC/Card';
import TimeRangeSelect from './TimeRangeSelect';
import MostBusyTimes from './MostBusyTimes';
import StateView from './StateView';
import AnalyticsOverviewSkeleton from './AnalyticsOverviewSkeleton';
import { Button as RACButton, TooltipTrigger } from 'react-aria-components';
import { Tooltip } from '@AC/ui/Tooltip';

const AnalyticsCard = ({ title, value, icon, tooltipInfo }) => {
  return (
    <Card className="wpchat:flex-1 wpchat:flex wpchat:justify-between wpchat:flex-nowrap wpchat:gap-1 wpchat:mb-0 wpchat:flex-col wpchat:py-3 wpchat:ps-4 wpchat:pe-8 wpchat:relative">
      <div className="wpchat:flex wpchat:items-center wpchat:justify-between wpchat:gap-2 wpchat:flex-nowrap">
        <div className="wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:whitespace-nowrap wpchat:text-ellipsis wpchat:overflow-hidden">
          <SvgLoader name={icon} className="wpchat:w-3 wpchat:h-3 wpchat:text-gray-800 wpchat:shrink-0" aria-label={`${title} icon`} />
          <span className="wpchat:text-[13px] wpchat:text-gray-800 wpchat:truncate wpchat:font-semibold wpchat:leading-relaxed">{title}</span>
        </div>
      </div>
        <TooltipTrigger delay={0}>
          <RACButton tabIndex={0} role="button" aria-label={__('Analytics card info', 'smashballoon-wpchat-livechat-customer-support')} className="wpchat:absolute wpchat:end-3 wpchat:top-2.5">
            <SvgLoader
              name="informationCircle"
              className="wpchat:w-4 wpchat:h-4 wpchat:text-gray-800"
              aria-label="Info icon"
            />
          </RACButton>
          <Tooltip placement="top">{tooltipInfo}</Tooltip>
        </TooltipTrigger>
      <span className={`wpchat:text-lg wpchat:font-semibold wpchat:text-gray-900 wpchat:ms-5 wpchat:leading-relaxed`}>{value}</span>
    </Card>
  );
};

const AnalyticsOverview = () => {
  const [timeRange, setTimeRange] = useState('this_month');
  const {
    loadOverview,
    loadBusyTimes,
    overview,
    busyTimes,
    overviewLoading,
    busyTimesLoading,
    overviewError,
    busyTimesError,
  } = useAnalyticsStore();

  useEffect(() => {
    loadOverview({ time_range: timeRange });
    loadBusyTimes({ time_range: timeRange });
  }, [timeRange]);

  if (overviewError || busyTimesError) {
    return (
      <StateView
        state="error"
        message={overviewError || busyTimesError}
      />
    );
  }

  const metrics = overview?.data || {};
  const interactions = metrics?.total_user_interactions || 0;
  const redirects = metrics?.total_redirects || 0;
  const conversionRate = metrics?.conversion_rate || metrics?.avg_conversion_rate || 0;
  const busyTimesData = busyTimes?.data || {};
  const timeBlocks = busyTimesData?.time_blocks || [];
  const timezoneInfo = overview?.data?.timezone_info || busyTimesData?.timezone_info || {};
  const currentPeriod = overview?.data?.current_period || {};

  return (
    <section className="wpchat:my-11.5">
      <div className="wpchat:grid wpchat:grid-cols-1 wpchat:md:grid-cols-2 wpchat:gap-3 wpchat:items-center wpchat:mb-3.5">
        <h3 className="wpchat:text-2xl wpchat:font-semibold wpchat:text-gray-900 wpchat:m-0 wpchat:leading-relaxed">{__('Analytics', 'smashballoon-wpchat-livechat-customer-support')}</h3>
        <TimeRangeSelect
          value={timeRange}
          onChange={setTimeRange}
          className="wpchat:min-w-[150px] wpchat:md:ms-auto wpchat:md:me-0"
        />
      </div>

      {(overviewLoading || busyTimesLoading) ? (
        <AnalyticsOverviewSkeleton />
      ) : (
        <>
          <div className="wpchat:grid wpchat:grid-cols-1 wpchat:md:grid-cols-3 wpchat:gap-2.5 wpchat:mb-2.5">
            {/* Interactions Card */}
            <AnalyticsCard
              title={__('Interactions', 'smashballoon-wpchat-livechat-customer-support')} value={interactions}
              icon="arrowCursor"
              tooltipInfo={__('Total user engagement events including chat opens, messages, FAQ clicks, and navigation actions', 'smashballoon-wpchat-livechat-customer-support')}
            />
            {/* Redirects Card */}
            <AnalyticsCard
              title={__('Chats Initiated', 'smashballoon-wpchat-livechat-customer-support')}
              value={redirects}
              icon="expandWindow"
              tooltipInfo={__('Number of chats initiated by users', 'smashballoon-wpchat-livechat-customer-support')}
            />
            {/* Conversion Rate Card */}
            <AnalyticsCard
              title={__('Conversion Rate', 'smashballoon-wpchat-livechat-customer-support')}
              value={`${conversionRate}%`}
              icon="arrowCursor"
              tooltipInfo={__('Percentage of users who opened the chat and completed a conversion action (redirect to platform or funnel completion)', 'smashballoon-wpchat-livechat-customer-support')}
            />
          </div>
          <MostBusyTimes
            busyTimesData={busyTimesData}
            timeBlocks={timeBlocks}
            timeRange={timeRange}
            period={currentPeriod}
            timezoneInfo={timezoneInfo}
          />
        </>
      )}
    </section>
  );
};

export default AnalyticsOverview;
