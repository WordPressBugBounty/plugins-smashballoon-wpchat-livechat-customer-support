import { wpChatAPI } from '@Utils/apiHelper';

export const FUNNELS_PER_PAGE = 5;

export const fetchFunnels = async (page = 1) => {
    return await wpChatAPI.get('funnels', { page, per_page: FUNNELS_PER_PAGE });
};

export const createFunnel = async (funnelData) => {
    const response = await wpChatAPI.post('funnels', funnelData);
    if (response && response.id) {
      return response;
    }
     throw new Error(__('Failed to create funnel', 'smashballoon-wpchat-livechat-customer-support'));
};

export const updateFunnel = async (id, funnelData) => {
    const response = await wpChatAPI.put(`funnels/${id}`, funnelData);
    return response && response.status === 200;
};

export const deleteFunnel = async (id) => {
    const response = await wpChatAPI.delete(`funnels/${id}`);
    return response && response.status === 200;
};

export const fetchFunnel = async (id) => {
    return await wpChatAPI.get(`funnels/${id}`);
};

export const cloneFunnel = async (id) => {
    const response = await wpChatAPI.post(`funnels/${id}/clone`);
    return response && response.status === 201;
};

export const bulkDeleteFunnels = async (ids) => {
    const response = await wpChatAPI.post('funnels/bulk-delete', { ids });
    return response && response.status === 200;
};

export const rebuildFunnelsVisibilityMap = async () => {
    const response = await wpChatAPI.post('funnels/visibility/rebuild');
    return response && response.success === true;
};

export const updateVisibilityMap = async (funnelId, visibility) => {
    const response = await wpChatAPI.post('funnels/visibility/update', {
        funnelId,
        visibility,
    });

    if (response?.success) {
        return { success: true };
    }

    if (response?.conflicts) {
        return { success: false, conflicts: response.conflicts };
    }

    return { success: false };
};

export const fetchFunnelAnalytics = async (funnelId, timeRange = 'this_month') => {
    return await wpChatAPI.get(
        `analytics/funnel-step-analysis/${funnelId}`,
        { time_range: timeRange }
    );
};

export const fetchFunnelAnalyticsSummary = async (timeRange = 'this_month') => {
    return await wpChatAPI.get(
        'analytics/funnel-analytics',
        { time_range: timeRange }
    );
};

