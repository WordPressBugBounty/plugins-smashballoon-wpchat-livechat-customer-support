import { create } from 'zustand';
import {
  fetchOverview,
  fetchBusyTimes,
  fetchFaqAnalytics,
  fetchAgentPerformance,
} from './analyticsApi';

const useAnalyticsStore = create((set, get) => ({
  // State
  overview: null,
  busyTimes: null,
  faqAnalytics: null,
  agentPerformance: null,

  // Loading states
  overviewLoading: false,
  busyTimesLoading: false,
  faqAnalyticsLoading: false,
  agentPerformanceLoading: false,

  // Error states
  overviewError: null,
  busyTimesError: null,
  faqAnalyticsError: null,
  agentPerformanceError: null,

  // Cache management
  dataCache: {},
  lastFetchTime: {},

  // Actions
  loadOverview: async (params = {}) => {
    const cacheKey = `overview-${JSON.stringify(params)}`;
    const cached = get().dataCache[cacheKey];
    const lastFetch = get().lastFetchTime[cacheKey];
    if (cached && lastFetch && (Date.now() - lastFetch) < 5 * 60 * 1000) {
      set({ overview: cached });
      return cached;
    }
    try {
      set({ overviewLoading: true, overviewError: null });
      const data = await fetchOverview(params);
      set({
        overview: data,
        overviewLoading: false,
        dataCache: { ...get().dataCache, [cacheKey]: data },
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: Date.now() }
      });
      return data;
    } catch (error) {
      set({ overviewError: error.message || 'Error fetching overview', overviewLoading: false });
      throw error;
    }
  },

  loadBusyTimes: async (params = {}) => {
    const cacheKey = `busyTimes-${JSON.stringify(params)}`;
    const cached = get().dataCache[cacheKey];
    const lastFetch = get().lastFetchTime[cacheKey];
    if (cached && lastFetch && (Date.now() - lastFetch) < 5 * 60 * 1000) {
      set({ busyTimes: cached });
      return cached;
    }
    try {
      set({ busyTimesLoading: true, busyTimesError: null });
      const data = await fetchBusyTimes(params);
      set({
        busyTimes: data,
        busyTimesLoading: false,
        dataCache: { ...get().dataCache, [cacheKey]: data },
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: Date.now() }
      });
      return data;
    } catch (error) {
      set({ busyTimesError: error.message || 'Error fetching busy times', busyTimesLoading: false });
      throw error;
    }
  },

  loadFaqAnalytics: async (params = {}) => {
    const cacheKey = `faqAnalytics-${JSON.stringify(params)}`;
    const cached = get().dataCache[cacheKey];
    const lastFetch = get().lastFetchTime[cacheKey];
    if (cached && lastFetch && (Date.now() - lastFetch) < 5 * 60 * 1000) {
      set({ faqAnalytics: cached });
      return cached;
    }
    try {
      set({ faqAnalyticsLoading: true, faqAnalyticsError: null });
      const data = await fetchFaqAnalytics(params);
      set({
        faqAnalytics: data,
        faqAnalyticsLoading: false,
        dataCache: { ...get().dataCache, [cacheKey]: data },
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: Date.now() }
      });
      return data;
    } catch (error) {
      set({ faqAnalyticsError: error.message || 'Error fetching FAQ analytics', faqAnalyticsLoading: false });
      throw error;
    }
  },

  loadAgentPerformance: async (params = {}) => {
    const cacheKey = `agentPerformance-${JSON.stringify(params)}`;
    const cached = get().dataCache[cacheKey];
    const lastFetch = get().lastFetchTime[cacheKey];
    if (cached && lastFetch && (Date.now() - lastFetch) < 5 * 60 * 1000) {
      set({ agentPerformance: cached });
      return cached;
    }
    try {
      set({ agentPerformanceLoading: true, agentPerformanceError: null });
      const data = await fetchAgentPerformance(params);
      set({
        agentPerformance: data,
        agentPerformanceLoading: false,
        dataCache: { ...get().dataCache, [cacheKey]: data },
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: Date.now() }
      });
      return data;
    } catch (error) {
      set({ agentPerformanceError: error.message || 'Error fetching agent performance', agentPerformanceLoading: false });
      throw error;
    }
  },

  // Cache and reset methods
  clearCache: () => set({ dataCache: {}, lastFetchTime: {} }),
  resetAnalyticsData: () => set({
    overview: null,
    busyTimes: null,
    faqAnalytics: null,
    agentPerformance: null,
    dataCache: {},
    lastFetchTime: {},
  }),
}));

export default useAnalyticsStore; 