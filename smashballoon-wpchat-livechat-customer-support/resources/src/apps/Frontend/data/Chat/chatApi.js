import { makeWPChatRequest } from '@Utils/apiHelper';
import { makeFrontendRequest } from '@Utils/apiHelper';

/**
 * Get available platforms that have at least one agent configured.
 *
 * @returns {Promise<{platforms: Array, offHoursData: object|null}>} Platforms and off-hours data.
 */
export const getAvailablePlatforms = async () => {
	const frontendNonce = window.wpChatFrontend?.frontendNonce || '';

	const response = await makeWPChatRequest('chatbot/available-platforms', {
		method: 'GET',
		params: {
			nonce: frontendNonce
		},
		context: 'both'
	});

	if (!response?.success) {
		throw new Error(response?.message || 'Failed to get available platforms');
	}

	return {
		platforms: Array.isArray(response.platforms) ? response.platforms : [],
		offHoursData: response.is_off_hours ? response.off_hours_data : null,
	};
};

/**
 * Fetch redirection links for all available platforms in a single batch request.
 *
 * @returns {Promise<Object>} Object with `links` and `errors` keyed by platform slug.
 */
export const getAllPlatformLinks = async () => {
	const frontendNonce = window.wpChatFrontend?.frontendNonce || '';

	const response = await makeWPChatRequest('chatbot/platform-links', {
		method: 'GET',
		params: {
			nonce: frontendNonce
		},
		context: 'both'
	});

	if (!response?.success) {
		throw new Error(response?.message || 'Failed to get platform links');
	}

	return {
		links: response.links || {},
		errors: response.errors || {},
	};
};

/**
 * Fire-and-forget REDIRECT_TO_PLATFORM analytics tracking on click.
 *
 * @param {string} platform Platform slug.
 * @param {string} agentId Agent ID.
 * @param {string} [source='chat'] Source (chat or funnel).
 * @param {string|null} [funnelId=null] Funnel ID if applicable.
 */
export const trackPlatformRedirect = (platform, agentId, source = 'chat', funnelId = null) => {
	const data = {
		platform,
		agent_id: agentId,
		source,
		nonce: window.wpChatFrontend?.frontendNonce || ''
	};

	if (funnelId) {
		data.funnel_id = funnelId;
	}

	// Fire-and-forget POST to existing chatbot endpoint for redirect tracking
	makeFrontendRequest('chatbot', {
		method: 'POST',
		data: {
			...data,
			customText: '',
			pdfFile: '',
		}
	}).catch(() => {
		// Swallow errors — analytics should not block the user
	});
};
