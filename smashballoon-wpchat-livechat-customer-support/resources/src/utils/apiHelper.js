import apiFetch from '@wordpress/api-fetch';

/**
 * Global API Helper for WPChat
 * Handles REST API URL construction that works with any WordPress permalink structure
 */

/**
 * Builds a proper REST API URL that works with both pretty permalinks and plain permalinks
 * @param {string} endpoint - The API endpoint (e.g., 'analytics/overview')
 * @param {Object} params - Query parameters object
 * @param {string} context - Either 'admin', 'frontend', or 'both' to get the right global variables
 * @returns {string} Properly formatted REST API URL
 */
export const buildRestUrl = (endpoint, params = {}, context = 'admin') => {
	// Get the base REST URL from the appropriate global variable
	let globalVar;

	if (context === 'both') {
		// Try admin first, then fallback to frontend
		globalVar = window.wpChatAdmin || window.wpChatFrontend;
	} else {
		globalVar = context === 'admin' ? window.wpChatAdmin : window.wpChatFrontend;
	}

	const baseRestUrl = globalVar?.restUrl || '/wp-json/wpchat/v1/';

	// Build the full endpoint URL
	let url = `${baseRestUrl}${endpoint}`;

	// Handle query parameters properly for both permalink structures
	const queryString = new URLSearchParams(params).toString();
	if (queryString) {
		// Check if the base REST URL already contains query parameters (plain permalinks)
		// For plain permalinks: ?rest_route=/wpchat/v1/
		// For pretty permalinks: /wp-json/wpchat/v1/
		const separator = baseRestUrl.includes('?') ? '&' : '?';
		url += `${separator}${queryString}`;
	}

	return url;
};

/**
 * Makes an authenticated API request to WPChat endpoints
 * @param {string} endpoint - The API endpoint (e.g., 'analytics/overview')
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} options.params - Query parameters for GET requests
 * @param {Object} options.data - Request body data for POST/PUT requests
 * @param {Object} options.headers - Additional headers
 * @param {string} options.context - Either 'admin', 'frontend', or 'both'
 * @returns {Promise} API response
 */
export const makeWPChatRequest = async (endpoint, options = {}) => {
	const {
		method = 'GET',
		params = {},
		data,
		headers = {},
		context = 'admin'
	} = options;

	// Get the appropriate nonce
	let globalVar, nonce;

	if (context === 'both') {
		// Try admin first, then fallback to frontend
		globalVar = window.wpChatAdmin || window.wpChatFrontend;
		nonce = globalVar?.restNonce || '';
	} else {
		globalVar = context === 'admin' ? window.wpChatAdmin : window.wpChatFrontend;
		nonce = globalVar?.restNonce || '';
	}

	// Build the URL with proper query parameter handling
	const url = buildRestUrl(endpoint, method === 'GET' ? params : {}, context);

	// Prepare headers
	const requestHeaders = {
		'Content-Type': 'application/json',
		'X-WP-Nonce': nonce,
		...headers
	};

	// Prepare the request configuration
	const requestConfig = {
		path: url,
		method,
		headers: requestHeaders,
	};

	// Add data for POST/PUT requests
	if (data && (method === 'POST' || method === 'PUT')) {
		requestConfig.data = data;
	}

	try {
		return await apiFetch(requestConfig);
	} catch (error) {
		// A full-page cache can serve nonces past their 12-24h life: refresh them once and retry
		const isFrontend = globalVar && globalVar === window.wpChatFrontend;
		if (!isFrontend || options.nonceRefreshed || error?.data?.status !== 403) {
			throw error;
		}
		try {
			await refreshFrontendNonce();
		} catch {
			// Refresh failed (offline, blocked): report the original 403, not the refresh error
			throw error;
		}
		const fresh = window.wpChatFrontend;
		const swap = (obj) => (obj && 'nonce' in obj ? { ...obj, nonce: fresh.frontendNonce } : obj);
		return makeWPChatRequest(endpoint, {
			...options,
			params: swap(params),
			data: swap(data),
			headers: 'X-WP-Nonce' in headers ? { ...headers, 'X-WP-Nonce': fresh.restNonce } : headers,
			nonceRefreshed: true,
		});
	}
};

let nonceRefresh = null;

/**
 * Replace expired frontend nonces with fresh ones. Concurrent callers share one refresh.
 * @returns {Promise<void>}
 */
export const refreshFrontendNonce = () => {
	if (!nonceRefresh) {
		nonceRefresh = fetchFreshNonces().finally(() => {
			nonceRefresh = null;
		});
	}
	return nonceRefresh;
};

const fetchFreshNonces = async () => {
	const config = window.wpChatFrontend;
	// Plain fetch with no X-WP-Nonce header: core rejects any request that carries a stale one
	const url = new URL(buildRestUrl('analytics/nonce', {}, 'frontend'), window.location.href).toString();
	const fresh = await fetch(url, { credentials: 'same-origin' }).then((r) => r.json());
	if (fresh?.frontendNonce) {
		config.frontendNonce = fresh.frontendNonce;
		config.restNonce = fresh.restNonce;
	}
	// That REST call runs as a guest, so a logged-in visitor gets their wp_rest nonce from core's admin-ajax action instead
	if (config.ajaxUrl) {
		try {
			const response = await fetch(`${config.ajaxUrl}?action=rest-nonce`, { credentials: 'same-origin' });
			const restNonce = response.ok ? (await response.text()).trim() : '';
			if (/^[0-9a-f]{10}$/.test(restNonce)) {
				config.restNonce = restNonce;
			}
		} catch {
			// Best effort: admin-ajax can be cross-origin or blocked, and the REST nonces above are already stored
		}
	}
};

/**
 * Convenience methods for common HTTP operations
 */
export const wpChatAPI = {
	/**
	 * GET request to WPChat API
	 */
	get: (endpoint, params = {}, context = 'admin') => {
		return makeWPChatRequest(endpoint, { method: 'GET', params, context });
	},
	
	/**
	 * POST request to WPChat API
	 */
	post: (endpoint, data = {}, context = 'admin') => {
		return makeWPChatRequest(endpoint, { method: 'POST', data, context });
	},
	
	/**
	 * PUT request to WPChat API
	 */
	put: (endpoint, data = {}, context = 'admin') => {
		return makeWPChatRequest(endpoint, { method: 'PUT', data, context });
	},
	
	/**
	 * DELETE request to WPChat API
	 */
	delete: (endpoint, context = 'admin') => {
		return makeWPChatRequest(endpoint, { method: 'DELETE', context });
	}
};

/**
 * Special helper for frontend requests that need both frontend and admin nonces
 */
export const makeFrontendRequest = (endpoint, options = {}) => {
	const frontendNonce = window.wpChatFrontend?.frontendNonce || '';
	const restNonce = window.wpChatFrontend?.restNonce || '';
	
	// Add frontend-specific data
	const data = {
		...options.data,
		nonce: frontendNonce
	};
	
	return makeWPChatRequest(endpoint, {
		...options,
		data,
		context: 'frontend',
		headers: {
			'X-WP-Nonce': restNonce,
			...options.headers
		}
	});
};