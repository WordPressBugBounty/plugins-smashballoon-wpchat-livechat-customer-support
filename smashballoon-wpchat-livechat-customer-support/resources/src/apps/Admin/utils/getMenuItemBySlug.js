import { menuData } from '@AP/Customizer/menuData';

/**
 * Retrieves a menu item object by its slug identifier.
 *
 * @param {string} slug - The unique slug of the menu item to find.
 * @returns {Object|null} The menu item object matching the slug, or null if not found.
 */
export function getMenuItemBySlug(slug) {
  return menuData.find((item) => item.slug === slug);
}
