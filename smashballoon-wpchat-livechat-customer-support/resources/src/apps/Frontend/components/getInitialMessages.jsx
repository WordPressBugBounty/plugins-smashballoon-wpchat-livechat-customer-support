import { __ } from '@wordpress/i18n';
import { formatOffHoursMessage } from '@FDataStore/Chat/offHoursHandler';

/**
 * Returns the initial chatbot message that triggers platform link prefetching.
 * Instead of creating option buttons with async onClick handlers (which Safari blocks),
 * this returns a `platform_links` message type that renders native <a> tags.
 *
 * When no platforms are available (off-hours with "disable contact" enabled),
 * returns a plain text off-hours message instead of the platform selector.
 *
 * @param {Array<string>} availablePlatforms - Array of platform slugs
 * @param {Object|null} offHoursData - Off-hours data from the API (null if not off-hours)
 * @param {Object|null} storeApi - The Zustand store instance for this chat widget
 * @returns {object} botMsg
 */
export function getInitialMessages(availablePlatforms = null, offHoursData = null, storeApi = null) {
  // Distinguish "still loading" (null/undefined) from "loaded but empty" ([]).
  // If platforms haven't been fetched yet, default to the platform_links message so
  // PlatformLinks can render its own loading dots and then the fetched result —
  // avoids a race where a fast click shows "agents offline" before data arrives.
  const isStillLoading = availablePlatforms === null || availablePlatforms === undefined;
  const platformsToShow = isStillLoading ? [] : availablePlatforms;

  // Only short-circuit to the offline text message when platforms are confirmed empty
  // AND we have explicit off-hours data from the backend. In every other case, defer to
  // PlatformLinks which owns the loading + empty-state UX.
  if (!isStillLoading && platformsToShow.length === 0 && offHoursData) {
    return {
      message: formatOffHoursMessage(offHoursData),
      type: 'text',
      messageType: 'receive',
      directAnswer: true,
    };
  }

  return {
    message: __('Which platform would you like to talk on?', 'smashballoon-wpchat-livechat-customer-support'),
    type: 'platform_links',
    messageType: 'receive',
    directAnswer: true,
    data: {
      platforms: platformsToShow,
    },
    storeApi,
  };
}
