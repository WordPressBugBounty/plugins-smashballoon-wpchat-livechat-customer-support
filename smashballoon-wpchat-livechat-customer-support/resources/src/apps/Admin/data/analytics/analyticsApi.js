import { wpChatAPI } from '@Utils/apiHelper';

// Time blocks configuration
const TIME_BLOCKS = [
  { label: '12–4am', hours: [0, 1, 2, 3] },
  { label: '4–8am', hours: [4, 5, 6, 7] },
  { label: '8am–12pm', hours: [8, 9, 10, 11] },
  { label: '12–4pm', hours: [12, 13, 14, 15] },
  { label: '4–8pm', hours: [16, 17, 18, 19] },
  { label: '8pm–12am', hours: [20, 21, 22, 23] },
];

/**
 * Aggregate hourly data into time blocks
 * @param {Array} hourlyData - Array of hourly data objects
 * @returns {Array} Aggregated time blocks data
 */
export const aggregateTimeBlocks = (hourlyData = []) => {
  return TIME_BLOCKS.map(block => {
    const blockData = hourlyData.filter(h => block.hours.includes(h.hour));
    return {
      label: block.label,
      total_user_interactions: blockData.reduce((sum, h) => sum + (h.total_user_interactions || 0), 0),
      total_redirects: blockData.reduce((sum, h) => sum + (h.total_redirects || 0), 0),
    };
  });
};

/**
 * Fetch overview statistics for the dashboard
 * @param {Object} params - Query parameters (e.g., { time_range })
 */
export const fetchOverview = async (params = {}) => {
  return await wpChatAPI.get('analytics/overview', params);
};

/**
 * Fetch busy times analytics with aggregated time blocks
 * @param {Object} params - Query parameters (e.g., { time_range })
 */
export const fetchBusyTimes = async (params = {}) => {
  const response = await wpChatAPI.get('analytics/busy-times', params);
  
  // Process the response to include aggregated time blocks
  if (response && response.data) {
    const hourlyBreakdown = response.data.hourly_breakdown || [];
    const aggregatedBlocks = aggregateTimeBlocks(hourlyBreakdown);
    
    return {
      ...response,
      data: {
        ...response.data,
        time_blocks: aggregatedBlocks,
      },
    };
  }
  
  return response;
};

/**
 * Fetch FAQ analytics
 * @param {Object} params - Query parameters (e.g., { time_range, limit })
 */
export const fetchFaqAnalytics = async (params = {}) => {
  return await wpChatAPI.get('analytics/faq-analytics', params);
};

/**
 * Fetch agent performance metrics
 * @param {Object} params - Query parameters (e.g., { time_range })
 */
export const fetchAgentPerformance = async (params = {}) => {
  return await wpChatAPI.get('analytics/agent-performance', params);
};