import { getFirstTwoOKLCHValues } from './getFirstTwoOKLCHValues';

/**
 * Calculates and returns the global lightness and chroma values from the color data.
 *
 * @returns {{ lightness: number, chroma: number }} An object containing the global lightness and chroma values.
 */
export function getGlobalLightnessAndChroma() {
  const rawColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--wpchat-color-widget-accent')
    .trim();

  const [lightness, chroma] = getFirstTwoOKLCHValues(rawColor) || [];

  return {
    lightness: typeof lightness === 'number' ? lightness : null,
    chroma: typeof chroma === 'number' ? chroma : null,
  };
}
