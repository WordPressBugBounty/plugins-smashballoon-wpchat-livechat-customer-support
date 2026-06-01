import { getLocalizeVariables } from '@Utils/getLocalizeVariables';

/**
 * Returns the full image path or URL for a given image name.
 * Useful for dynamically referencing images stored in a specific directory or asset structure.
 *
 * @function
 * @param {string} imageName - The name or filename of the image.
 * @returns {string} The resolved image path or URL.
 */
export function getImagePath(imageName) {
  const pluginImageUrl = getLocalizeVariables('pluginUrl')
    ? getLocalizeVariables('pluginUrl') + 'public/assets/images'
    : '';
  const ImageUrl = pluginImageUrl && imageName ? `${pluginImageUrl}/${imageName}` : '';

  return ImageUrl;
}
