/**
 * Detect if the current device is a mobile device.
 *
 * @returns {boolean}
 */
export function isMobileDevice() {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const hasTouch = navigator.maxTouchPoints > 1;
  return isMobile && hasTouch;
}
