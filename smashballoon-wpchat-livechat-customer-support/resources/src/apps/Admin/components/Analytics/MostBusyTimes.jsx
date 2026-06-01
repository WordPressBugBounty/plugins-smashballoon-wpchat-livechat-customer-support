import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import React, { useState } from 'react';
import { Button as RACButton } from 'react-aria-components';
import { __ } from '@wordpress/i18n';
import UpgradeToProBlurNotice from '@AC/UpgradeToProBlurNotice';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import PeriodInfo from './PeriodInfo';
import StateView from './StateView';

const CHART_TABS = [
  {
    label: __('Interactions', 'smashballoon-wpchat-livechat-customer-support'),
    value: 'total_user_interactions',
  },
  {
    label: __('Chats Initiated', 'smashballoon-wpchat-livechat-customer-support'),
    value: 'total_redirects',
  },
];

// Dummy data for users without advanced analytics entitlement
const DUMMY_CHART_DATA = [
  { label: __('12am-4am', 'smashballoon-wpchat-livechat-customer-support'), value: 12 },
  { label: __('4am-8am', 'smashballoon-wpchat-livechat-customer-support'), value: 28 },
  { label: __('8am-12pm', 'smashballoon-wpchat-livechat-customer-support'), value: 85 },
  { label: __('12pm-4pm', 'smashballoon-wpchat-livechat-customer-support'), value: 67 },
  { label: __('4pm-8pm', 'smashballoon-wpchat-livechat-customer-support'), value: 45 },
  { label: __('8pm-12am', 'smashballoon-wpchat-livechat-customer-support'), value: 60 },
];

const DUMMY_PEAK_BLOCK = { label: __('8am-12pm', 'smashballoon-wpchat-livechat-customer-support'), total_user_interactions: 85, total_redirects: 42 };

const MostBusyTimes = ({ busyTimesData, timeBlocks, timeRange, period, timezoneInfo }) => {
  const { isPro: isProPlan, hasFeature } = useEntitlements();
  const upgradeDialogData = getUpgradeDialogData('analytics', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.analytics,
  });

  const [chartTab, setChartTab] = useState('total_user_interactions');

  // Check if user has advanced analytics entitlement
  const hasAdvancedAnalytics = hasFeature('wpchat.analytics.advanced');

  // Prepare chart data for recharts - use dummy data if user doesn't have entitlement
  const chartData = hasAdvancedAnalytics
    ? !busyTimesData.hourly_breakdown || busyTimesData.hourly_breakdown.length === 0
      ? []
      : timeBlocks.map((block) => ({
          label: block.label,
          value: block[chartTab],
        }))
    : DUMMY_CHART_DATA;

  // Check if the current tab has any data (all values are 0 or undefined)
  const hasCurrentTabData = hasAdvancedAnalytics
    ? chartData.length > 0 && chartData.some((item) => item.value > 0)
    : true; // Always show chart for dummy data

  // Find the peak time block for display - use dummy data if user doesn't have entitlement
  const peakBlock = hasAdvancedAnalytics
    ? timeBlocks && timeBlocks.length > 0
      ? timeBlocks.reduce((max, block) => (block[chartTab] > max[chartTab] ? block : max), {
          [chartTab]: 0,
          label: '',
        })
      : { [chartTab]: 0, label: '' }
    : DUMMY_PEAK_BLOCK;

  // Function to get dynamic subtext based on time filter
  const getTimeFilterText = () => {
    switch (timeRange) {
      case 'today':
        return __('Today', 'smashballoon-wpchat-livechat-customer-support');
      case 'this_week':
        return __('This week', 'smashballoon-wpchat-livechat-customer-support');
      case 'this_month':
        return __('This month', 'smashballoon-wpchat-livechat-customer-support');
      case 'last_month':
        return __('Last month', 'smashballoon-wpchat-livechat-customer-support');
      case 'previous_period':
        return __('Previous period', 'smashballoon-wpchat-livechat-customer-support');
      default:
        return __('This month', 'smashballoon-wpchat-livechat-customer-support');
    }
  };

  return (
    <div className='wpchat:rounded-xl wpchat:bg-white wpchat:shadow-sm'>
      {/* Header */}
      <div className='wpchat:grid-cols-1 wpchat:items-center wpchat:mb-4 wpchat:grid wpchat:justify-between wpchat:border-b wpchat:border-gray-200 wpchat:px-5 wpchat:py-2 wpchat:md:grid-cols-2'>
        <h3 className='wpchat:m-0 wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900 wpchat:md:mb-0 wpchat:mb-2 '>
          {__('Most Busy Times', 'smashballoon-wpchat-livechat-customer-support')}
        </h3>
        {/* Tabs for chart toggle */}
        <div className='wpchat:flex wpchat:md:justify-end wpchat:justify-start'>
          <div className='wpchat:flex wpchat:rounded-md wpchat:border wpchat:border-gray-200 wpchat:bg-gray-200 wpchat:p-0.5'>
            {CHART_TABS.map((tab) => (
              <RACButton
                key={tab.value}
                className={`wpchat:h-7 wpchat:cursor-pointer wpchat:truncate wpchat:overflow-hidden wpchat:rounded-md wpchat:px-4 wpchat:py-1 wpchat:text-sm wpchat:font-medium wpchat:whitespace-nowrap wpchat:transition-colors ${
                  chartTab === tab.value
                    ? 'wpchat:bg-white wpchat:text-black'
                    : 'hover:wpchat:bg-[var(--color-gray-900)] wpchat:bg-[var(--color-gray-100)] wpchat:text-gray-500'
                }`}
                onPress={() => setChartTab(tab.value)}
                aria-label={tab.label}
              >
                {tab.label}
              </RACButton>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade to Pro Blur Notice wraps all content */}
      <UpgradeToProBlurNotice
        icon='adsClick'
        title={__(
          'Know your most busy times and interactions when you upgrade',
          'smashballoon-wpchat-livechat-customer-support',
        )}
        upgradeDialogData={upgradeDialogData}
        requiredEntitlement='wpchat.analytics.advanced'
      >
        {!hasCurrentTabData ? (
          <div className='wpchat:p-8'>
            <StateView
              state='empty'
              heading={__('No activity yet', 'smashballoon-wpchat-livechat-customer-support')}
              message={__(
                "We'll highlight busy periods after the assistant receives enough traffic.",
                'smashballoon-wpchat-livechat-customer-support',
              )}
              icon='analytics'
            />
          </div>
        ) : (
          <div className='wpchat:grid wpchat:grid-cols-1 wpchat:items-end wpchat:gap-6 wpchat:px-8 wpchat:py-10 wpchat:md:grid-cols-[30fr_70fr] wpchat:lg:flex-row'>
            <div className='wpchat:pb-10'>
              {peakBlock.label && (
                <div className='wpchat:text-center wpchat:lg:text-start'>
                  <div className='wpchat:mb-1 wpchat:text-4xl wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
                    {peakBlock.label}
                  </div>
                  <div className='wpchat:text-[13px] wpchat:leading-relaxed wpchat:text-gray-500'>
                    {getTimeFilterText()}{' '}
                    {__(
                      'users interacted with Chat Assistant the most from',
                      'smashballoon-wpchat-livechat-customer-support',
                    )}{' '}
                    {peakBlock.label}
                  </div>
                </div>
              )}
            </div>

            <div className='wpchat:w-full'>
              <div className='wpchat:w-full' style={{ height: 220 }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={chartData}
                    barCategoryGap={20}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <XAxis
                      dataKey='label'
                      tick={{ fontSize: 12, fill: '#696D80' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: '#696D80' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => value}
                      domain={[0, 'dataMax + 10']}
                      grid={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [
                        value,
                        chartTab === 'total_user_interactions'
                          ? __('Interactions', 'smashballoon-wpchat-livechat-customer-support')
                          : __('Chats Initiated', 'smashballoon-wpchat-livechat-customer-support'),
                      ]}
                      labelFormatter={(label) =>
                        `${__('Time', 'smashballoon-wpchat-livechat-customer-support')}: ${label}`
                      }
                    />
                    <Bar
                      dataKey='value'
                      fill='var(--wpchat-color-wp-blue-200)'
                      radius={[3, 3, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className='wpchat:mt-2'>
                <PeriodInfo period={period} timezoneInfo={timezoneInfo} />
              </div>
            </div>
          </div>
        )}
      </UpgradeToProBlurNotice>
    </div>
  );
};

export default MostBusyTimes;
