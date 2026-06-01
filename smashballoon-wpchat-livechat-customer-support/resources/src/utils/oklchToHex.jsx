import { formatHsl, oklch } from 'culori';

/**
 * Converts an OKLCH color to HEX (sRGB).
 * @param {number} l - Lightness (0 to 1)
 * @param {number} c - Chroma (typically 0 to ~0.4 for in-gamut)
 * @param {number} h - Hue in degrees (0 to 360)
 * @returns {string|null} HEX color string or null if conversion fails
 */
export function oklchToHex(lightness, chroma, hue) {
  const oklchColor = { mode: 'oklch', l: lightness, c: chroma, h: hue };
  const srgbColor = formatHsl(oklch(oklchColor));
  return srgbColor;
}
