import { makeWPChatRequest } from '@Utils/apiHelper';
import { makeFrontendRequest } from '@Utils/apiHelper';

/**
 * Get platform redirection link.
 *
 * @param {string} platform The platform to get the link for.
 * @param {string} [customText=''] Custom text to include in the link.
 * @param {string} [pdfFile=''] URL of PDF file to include.
 * @param {string} [source='chat'] Source tracking parameter (e.g., 'funnel', 'chat').
 * @param {string|number|null} [funnelId=null] Funnel ID if source is funnel.
 * @returns {Promise<Object>} The platform link data.
 */
export const getPlatformLink = async (platform, customText = '', pdfFile = '', source = 'chat', funnelId = null) => {
	try {
		const data = { 
			platform, 
			customText, 
			pdfFile,
			source // Include source for backend tracking
		};
		
		// Include funnel_id if provided
		if (funnelId) {
			data.funnel_id = funnelId;
		}
		
		const response = await makeFrontendRequest('chatbot', {
			method: 'POST',
			data
		});

		if (!response?.success) {
			throw new Error(response?.message || 'Failed to get platform link');
		}

		return response;
	} catch (error) {
		throw error;
	}
};

/**
 * Get available platforms that have at least one agent configured.
 *
 * @returns {Promise<Array>} List of available platform slugs.
 */
export const getAvailablePlatforms = async () => {
	try {
		// Get the frontend nonce for non-logged-in users
		const frontendNonce = window.wpChatFrontend?.frontendNonce || '';

		const response = await makeWPChatRequest('chatbot/available-platforms', {
			method: 'GET',
			params: {
				nonce: frontendNonce // Pass nonce as query parameter for public access
			},
			context: 'both'
		});

		if (!response?.success) {
			throw new Error(response?.message || 'Failed to get available platforms');
		}

		return Array.isArray(response.platforms) && response.platforms.length > 0 ? response.platforms : ['whatsapp'];
	} catch (error) {
		console.error('Error fetching available platforms:', error);
		return ['whatsapp'];
	}
};
