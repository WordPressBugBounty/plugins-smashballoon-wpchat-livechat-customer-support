import apiFetch from '@wordpress/api-fetch';

/**
 * Build REST API URL that works with both pretty and plain permalinks
 *
 * @param {string} endpoint - API endpoint, e.g. 'pages'
 * @param {Object} params - Query parameters
 * @param {string} context - Either 'admin' or 'frontend'
 */
const buildWpRestUrl = (endpoint, params = {}, context = 'admin') => {
  const globalVar = context === 'admin' ? window.wpChatAdmin : window.wpChatFrontend;

  // WordPress sets this correctly depending on permalink structure:
  // - Pretty permalinks: /wp-json/wp/v2/
  // - Plain permalinks:  /index.php?rest_route=/wp/v2/
  let baseRestUrl = globalVar?.wpRestUrl || window.wpApiSettings?.root || '/wp-json/wp/v2/';

  // Ensure /wp/v2/ is present
  if (baseRestUrl.includes('rest_route=')) {
    // Plain permalinks → make sure it ends with /wp/v2/
    if (!baseRestUrl.endsWith('/')) baseRestUrl += '/';
    baseRestUrl += 'wp/v2/';
  } else {
    // Pretty permalinks → /wp-json/wp/v2/
    if (!baseRestUrl.endsWith('/')) baseRestUrl += '/';
    if (!baseRestUrl.includes('wp/v2')) {
      baseRestUrl += 'wp/v2/';
    }
  }

  let url;

  if (baseRestUrl.includes('rest_route=')) {
    // Plain permalinks → append endpoint after rest_route
    // Example: index.php?rest_route=/wp/v2/pages
    url = `${baseRestUrl}${endpoint}`;
  } else {
    // Pretty permalinks → normal path style
    // Example: /wp-json/wp/v2/pages
    url = `${baseRestUrl}${endpoint}`;
  }

  // Add query params (search, pagination, etc.)
  const queryString = new URLSearchParams(params).toString();
  if (queryString) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}${queryString}`;
  }

  return url;
};

// Common headers for all requests
const getHeaders = (context = 'admin') => {
  const globalVar = context === 'admin' ? window.wpChatAdmin : window.wpChatFrontend;
  return {
    'Content-Type': 'application/json',
    'X-WP-Nonce': globalVar?.restNonce || '',
  };
};

/**
 * Process API response to include pagination metadata from headers
 */
const processApiResponse = (response, data) => {
  const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

  return { items: data, total, totalPages };
};

/**
 * Pages API
 */
export const fetchPages = async (params = {}, context = 'admin') => {
  const path = buildWpRestUrl('pages', params, context);

  const response = await apiFetch({
    path,
    method: 'GET',
    headers: getHeaders(context),
    parse: false,
  });
  const data = await response.json();

  return processApiResponse(response, data);
};

/**
 * Categories API
 */
export const fetchCategories = async (params = {}, context = 'admin') => {
  const path = buildWpRestUrl('categories', params, context);

  const response = await apiFetch({
    path,
    method: 'GET',
    headers: getHeaders(context),
    parse: false,
  });
  const data = await response.json();

  return processApiResponse(response, data);
};

/**
 * Tags API
 */
export const fetchTags = async (params = {}, context = 'admin') => {
  const path = buildWpRestUrl('tags', params, context);

  const response = await apiFetch({
    path,
    method: 'GET',
    headers: getHeaders(context),
    parse: false,
  });
  const data = await response.json();

  return processApiResponse(response, data);
};

/**
 * Post Types API
 */
export const fetchPostTypes = async (context = 'admin') => {
  const path = buildWpRestUrl('types', {}, context);
  return await apiFetch({ path, method: 'GET', headers: getHeaders(context) });
};
