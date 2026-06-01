import React, { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import useAnalyticsStore from '@DataStore/analytics/analyticsStore';
import TimeRangeSelect from './TimeRangeSelect';
import StateView from './StateView';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAvatarFallback } from '@Utils/getAvatarFallback';
import Avatar from '@Components/Avatar';
import UpgradeToProBlurNotice from '@AC/UpgradeToProBlurNotice';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { useEntitlements } from '@AH/useEntitlements';

const BAR_COLOR = '#E2F5FF';
const BAR_HOVER_COLOR = '#0096CC';

// Dummy data for users without advanced analytics entitlement
const DUMMY_AGENT_STATS = [
  { agent_id: 1, agent_name: __('Sarah Johnson', 'smashballoon-wpchat-livechat-customer-support'), agent_avatar: 'SJ', total_assignments: 156 },
  { agent_id: 2, agent_name: __('Michael Chen', 'smashballoon-wpchat-livechat-customer-support'), agent_avatar: 'MC', total_assignments: 142 },
  { agent_id: 3, agent_name: __('Emily Davis', 'smashballoon-wpchat-livechat-customer-support'), agent_avatar: 'ED', total_assignments: 98 },
  { agent_id: 4, agent_name: __('James Wilson', 'smashballoon-wpchat-livechat-customer-support'), agent_avatar: 'JW', total_assignments: 87 },
  { agent_id: 5, agent_name: __('Amanda Roberts', 'smashballoon-wpchat-livechat-customer-support'), agent_avatar: 'AR', total_assignments: 64 },
];

const DUMMY_TOTALS = {
  total_assignments: 547,
  unique_agents: 5,
};

// ✅ Tooltip
const CustomTooltip = ({ active, payload, timeRange }) => {
  if (!active || !payload?.length) return null;
  
  const { name, chats } = payload[0].payload;
  return (
    <div className="wpchat:w-full wpchat:max-w-[195px] wpchat:rounded-md wpchat:bg-gray-800 wpchat:px-3 wpchat:py-2 wpchat:text-center wpchat:text-sm wpchat:text-white">
      {sprintf(
        __('%s was assigned %d chats %s', 'smashballoon-wpchat-livechat-customer-support'),
        name,
        chats,
        timeRange ? timeRange.replace('_', ' ') : ''
      )}
    </div>
  );
};

// ✅ Label inside bar
const CustomLabel = ({ x, y, value, index, hoveredIndex }) => {
  const isHovered = hoveredIndex === index;
  return (
    <text
      x={x + 70}
      y={y + 25}
      textAnchor="end"
      className={`wpchat:pointer-events-none wpchat:text-sm wpchat:font-semibold ${
        isHovered ? 'wpchat:fill-white' : 'wpchat:fill-wp-blue-500'
      }`}
      style={isHovered ? { textShadow: '0px 1px 2px rgba(0,0,0,0.6)' } : undefined}
    >
      {value} {__('chats', 'smashballoon-wpchat-livechat-customer-support')}
    </text>
  );
};

// ✅ Y-axis tick (avatar + name)
const CustomYAxisTick = ({ x, y, payload, barData }) => {
  const item = barData?.find((d) => d.name === payload.value);
  if (!item) return null;
  
  const avatarFallback = getAvatarFallback(item.name);
  const isUrl = item.avatar.startsWith('http');
  
  return (
    <foreignObject x={x - 135} y={y - 10} width={135} height={40}>
      <div className="wpchat:flex wpchat:items-center wpchat:gap-3">
        <Avatar
          file={isUrl ? item.avatar : null}
          fallback={{ ...avatarFallback, text: item.avatar }}
          className="wpchat:h-6 wpchat:w-6 wpchat:text-xs wpchat:shrink-0"
        />
        <span className="wpchat:truncate wpchat:text-sm wpchat:text-gray-800">
          {item.name}
        </span>
      </div>
    </foreignObject>
  );
};

const AgentStats = () => {
  const [timeRange, setTimeRange] = useState('this_month');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { isPro: isProPlan, hasFeature } = useEntitlements();
  const upgradeDialogData = getUpgradeDialogData('analytics', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.analytics,
  });

  const {
    loadAgentPerformance,
    agentPerformance,
    agentPerformanceLoading,
    agentPerformanceError,
  } = useAnalyticsStore();

  // Check if user has advanced analytics entitlement
  const hasAdvancedAnalytics = hasFeature('wpchat.analytics.advanced');

  useEffect(() => {
    loadAgentPerformance({ time_range: timeRange });
  }, [timeRange]);

  // Use dummy data if user doesn't have entitlement
  const totals = hasAdvancedAnalytics ? (agentPerformance?.data?.totals || {}) : DUMMY_TOTALS;
  const agentStats = hasAdvancedAnalytics ? (agentPerformance?.data?.agent_statistics || []) : DUMMY_AGENT_STATS;
  const timeRangeValue = agentPerformance?.time_range || timeRange;

  const totalAssignments = totals.total_assignments || 0;
  const uniqueAgents = totals.unique_agents || 0;

  const barData = agentStats
    .sort((a, b) => (b.total_assignments || 0) - (a.total_assignments || 0))
    .map((agent) => ({
      name: agent.agent_name || `Agent #${agent.agent_id}`,
      chats: agent.total_assignments || 0,
      avatar: agent.agent_avatar || (agent.agent_name || `Agent #${agent.agent_id}`).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }));

  // Calculate dynamic height based on number of agents
  const minHeight = 70;
  const heightPerAgent = 55;
  const dynamicHeight = Math.max(minHeight, barData.length * heightPerAgent);

  return (
    <section className="wpchat:mb-8">
      <div className="wpchat:grid wpchat:grid-cols-1 wpchat:md:grid-cols-2 wpchat:gap-3 wpchat:items-center wpchat:mb-3.5">
        <h3 className="wpchat:text-2xl wpchat:font-semibold wpchat:text-gray-900 wpchat:m-0">
          {__('Stats by Agent', 'smashballoon-wpchat-livechat-customer-support')}
        </h3>
        <TimeRangeSelect
          value={timeRangeValue}
          onChange={setTimeRange}
          className="wpchat:min-w-[150px] wpchat:md:ms-auto wpchat:md:me-0"
        />
      </div>
      <div className="wpchat:bg-white wpchat:rounded-xl wpchat:shadow-sm">
        <div className="wpchat:flex wpchat:items-center wpchat:justify-between wpchat:border-b wpchat:border-gray-200 wpchat:py-3 wpchat:px-5">
          <h3 className="wpchat:font-semibold wpchat:text-sm wpchat:text-gray-900 wpchat:m-0">
            {__('Total chats assigned', 'smashballoon-wpchat-livechat-customer-support')}
          </h3>
        </div>

        {hasAdvancedAnalytics && agentPerformanceLoading ? (
          <StateView state="loading" />
        ) : hasAdvancedAnalytics && agentPerformanceError ? (
          <StateView
            state="error"
            message={agentPerformanceError}
          />
        ) : hasAdvancedAnalytics && agentStats.length === 0 ? (
          <StateView
            state="empty"
            heading={__('No chats recorded', 'smashballoon-wpchat-livechat-customer-support')}
            message={__('Once your customers start chatting, we\'ll show you who handled what', 'smashballoon-wpchat-livechat-customer-support')}
            icon="dualChat"
          />
        ) : (
          <div className="wpchat:flex wpchat:flex-col wpchat:lg:flex-row wpchat:gap-6 wpchat:md:p-8 wpchat:p-5">

            <div className="wpchat:w-full wpchat:lg:w-[30%] wpchat:flex wpchat:flex-col wpchat:justify-center">
              <div className="wpchat:text-center wpchat:lg:text-start">
                <div className="wpchat:text-4xl wpchat:font-semibold wpchat:text-gray-900 wpchat:mb-2">
                  {totalAssignments}
                </div>
                <div className="wpchat:text-sm wpchat:text-gray-500">
                  {sprintf(
                    __('Total chats assigned were answered by %d agents %s', 'smashballoon-wpchat-livechat-customer-support'),
                    uniqueAgents,
                    timeRangeValue.replace('_', ' ')
                  )}
                </div>
              </div>
            </div>

            <div className="wpchat:w-full wpchat:lg:w-[70%]">
              <UpgradeToProBlurNotice
                icon="supportAgent"
                title={__('See detailed agent performance stats when you upgrade', 'smashballoon-wpchat-livechat-customer-support')}
                upgradeDialogData={upgradeDialogData}
                requiredEntitlement="wpchat.analytics.advanced"
                minHeight={dynamicHeight}
              >
                <ResponsiveContainer width="100%" height={dynamicHeight}>
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 10, right: 30, bottom: 10, left: 120 }}
                    barCategoryGap={7}
                    barSize={40}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={(props) => <CustomYAxisTick {...props} barData={barData} />}
                    />
                    <Tooltip content={<CustomTooltip timeRange={timeRangeValue} />} cursor={false} />
                    <Bar
                      dataKey="chats"
                      radius={[3, 3, 3, 3]}
                      minPointSize={5}
                      isAnimationActive={false}
                    >
                      {barData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={hoveredIndex === index ? BAR_HOVER_COLOR : BAR_COLOR}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                      ))}
                      <LabelList
                        dataKey="chats"
                        content={(props) => (
                          <CustomLabel {...props} hoveredIndex={hoveredIndex} />
                        )}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </UpgradeToProBlurNotice>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AgentStats; 