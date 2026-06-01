/**
 * Format WordPress API pages data for UI components
 * 
 * @param {Array} pages Raw pages data from WordPress API
 * @returns {Array} Formatted pages data
 */
export const formatPages = (pages = []) => {
  if (!pages || !Array.isArray(pages)) return [];

  return pages.map(page => ({
    id: page.id.toString(),
    title: page.title.rendered,
    description: `/${page.slug}`
  }));
};

/**
 * Format WordPress API categories data for UI components
 * 
 * @param {Array} categories Raw categories data from WordPress API
 * @returns {Array} Formatted categories data
 */
export const formatCategories = (categories = []) => {
  if (!categories || !Array.isArray(categories)) return [];

  return categories.map(category => ({
    id: category.id.toString(),
    title: category.name,
    description: `/${category.slug}`
  }));
};

/**
 * Format WordPress API tags data for UI components
 * 
 * @param {Array} tags Raw tags data from WordPress API
 * @returns {Array} Formatted tags data
 */
export const formatTags = (tags = []) => {
  if (!tags || !Array.isArray(tags)) return [];

  return tags.map(tag => ({
    id: tag.id.toString(),
    title: tag.name,
    description: `/${tag.slug}`
  }));
};

/**
 * Format WordPress API post types data for UI components
 * Filters out built-in WordPress types and formats for UI consumption
 * 
 * @param {Object} postTypes Raw post types data from WordPress API
 * @returns {Array} Formatted post types data
 */
export const formatPostTypes = (postTypes = {}) => {
  if (!postTypes || typeof postTypes !== 'object') return [];

  // Filter out WordPress core types that we don't want to show
  const coreTypes = ['post', 'page', 'attachment', 'nav_menu_item', 'wp_block', 'wp_template', 'wp_template_part', 'wp_global_styles', 'wp_navigation', 'wp_font_family', 'wp_font_face'];

  return Object.entries(postTypes)
    .filter(([slug]) => !coreTypes.includes(slug))
    .map(([slug, data]) => ({
      id: slug,
      title: data.name || slug,
      description: `/${data.rest_base || slug}`
    }));
};