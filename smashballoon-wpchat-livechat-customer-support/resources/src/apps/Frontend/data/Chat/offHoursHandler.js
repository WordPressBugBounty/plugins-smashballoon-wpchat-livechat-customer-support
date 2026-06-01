import { __ } from '@wordpress/i18n';

/**
 * Check if error is the specific off-hours scenario.
 *
 * @param {Error} error The error object from the API call.
 * @returns {boolean} True if this is an off-hours error.
 */
export const isOffHoursError = (error) => {
	return error?.data?.data?.error_type === 'agents_offline_off_hours';
};

/**
 * Extract off-hours data from error response.
 *
 * @param {Error} error The error object from the API call.
 * @returns {Object|null} Off-hours data or null if not applicable.
 */
export const getOffHoursData = (error) => {
	if (isOffHoursError(error)) {
		return error.data.data.off_hours_data;
	}
	return null;
};

/**
 * Format off-hours message with time display rules.
 * Includes caching to avoid repeated calculations.
 *
 * @param {Object} offHoursData The off-hours data from the API.
 * @returns {string} Formatted off-hours message.
 */
export const formatOffHoursMessage = (offHoursData) => {
	const customMessage = window.wpChatFrontend?.offHoursMessage;
	if (customMessage) {
		return customMessage;
	}

	if (!offHoursData?.next_available_utc) {
		if (offHoursData?.general_hours) {
			const businessHours = formatTodayBusinessHours(offHoursData.general_hours);
			return `${__('Our agents are currently offline.', 'smashballoon-wpchat-livechat-customer-support')} ${__('Our business hours are', 'smashballoon-wpchat-livechat-customer-support')} ${businessHours}.`;
		}
		return __('Our agents are currently offline. Please check back during business hours.', 'smashballoon-wpchat-livechat-customer-support');
	}

	// Check cache first
	const cacheKey = 'wpchat_off_hours_message';
	const cached = getCachedOffHoursMessage(cacheKey, offHoursData.next_available_utc.timestamp);
	if (cached) {
		return cached;
	}

	const now = new Date();

	// Use the backend time directly (it's already in WordPress timezone)
	const nextAvailable = new Date(offHoursData.next_available_utc.timestamp * 1000);
	const minutesUntil = Math.round((nextAvailable - now) / (1000 * 60));

	// Apply time display rules
	const timeUntilText = formatTimeUntilAvailable(minutesUntil, offHoursData);

	// Format business hours using backend times directly
	const businessHours = formatTodayBusinessHours(offHoursData.general_hours);

	let message;
	if (timeUntilText.startsWith(__('tomorrow at', 'smashballoon-wpchat-livechat-customer-support')) || timeUntilText.startsWith(__('on', 'smashballoon-wpchat-livechat-customer-support'))) {
		message = `${__('Looks like our agents are offline right now! They\'ll be available', 'smashballoon-wpchat-livechat-customer-support')} ${timeUntilText}.\n\n${__('Our business hours are', 'smashballoon-wpchat-livechat-customer-support')} ${businessHours}.`;
	} else {
		message = `${__('Looks like our agents are offline right now! They\'ll be available in about', 'smashballoon-wpchat-livechat-customer-support')} ${timeUntilText}.\n\n${__('Our business hours are', 'smashballoon-wpchat-livechat-customer-support')} ${businessHours}.`;
	}

	// Cache the message for max 1 hour to prevent stale time displays
	const maxCacheTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
	const cacheExpiry = Math.min(offHoursData.next_available_utc.timestamp, maxCacheTime);
	setCachedOffHoursMessage(cacheKey, message, cacheExpiry);

	return message;
};

/**
 * Get cached off-hours message if still valid.
 *
 * @param {string} cacheKey Cache key.
 * @param {number} nextAvailableTimestamp Next available timestamp.
 * @returns {string|null} Cached message or null if expired/invalid.
 */
function getCachedOffHoursMessage(cacheKey, nextAvailableTimestamp) {
	try {
		const cached = sessionStorage.getItem(cacheKey);
		if (!cached) return null;

		const { message, expiry } = JSON.parse(cached);
		const now = Math.floor(Date.now() / 1000);

		// Check if cache is still valid and matches current scenario
		if (expiry > now && expiry === nextAvailableTimestamp) {
			return message;
		}

		// Clear expired cache
		sessionStorage.removeItem(cacheKey);
		return null;
	} catch (e) {
		// Clear invalid cache
		sessionStorage.removeItem(cacheKey);
		return null;
	}
}

/**
 * Cache off-hours message until next available time.
 *
 * @param {string} cacheKey Cache key.
 * @param {string} message Formatted message.
 * @param {number} nextAvailableTimestamp Next available timestamp.
 */
function setCachedOffHoursMessage(cacheKey, message, nextAvailableTimestamp) {
	try {
		const cacheData = {
			message,
			expiry: nextAvailableTimestamp,
			cached_at: Math.floor(Date.now() / 1000)
		};
		sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
	} catch (e) {
		// Ignore cache errors (e.g., storage quota exceeded)
		console.warn('Unable to cache off-hours message:', e);
	}
}

/**
 * Format time until available based on display rules.
 *
 * @param {number} minutes Minutes until next available time.
 * @param {Object} offHoursData The off-hours data from the API.
 * @returns {string} Formatted time string.
 */
function formatTimeUntilAvailable(minutes, offHoursData) {
	if (minutes < 60) {
		// Round up to nearest 5 minutes
		const rounded = Math.ceil(minutes / 5) * 5;
		return `${rounded} ${rounded === 1 ? __('minute', 'smashballoon-wpchat-livechat-customer-support') : __('minutes', 'smashballoon-wpchat-livechat-customer-support')}`;
	} else if (minutes < 120) {
		// 1-2 hours: show hours and minutes, round up by 15 minutes
		const hours = Math.floor(minutes / 60);
		const mins = Math.ceil((minutes % 60) / 15) * 15;

		if (mins === 60) {
			return `${hours + 1} ${hours + 1 === 1 ? __('hour', 'smashballoon-wpchat-livechat-customer-support') : __('hours', 'smashballoon-wpchat-livechat-customer-support')}`;
		} else if (mins === 0) {
			return `${hours} ${hours === 1 ? __('hour', 'smashballoon-wpchat-livechat-customer-support') : __('hours', 'smashballoon-wpchat-livechat-customer-support')}`;
		} else {
			return `${hours} ${hours === 1 ? __('hour', 'smashballoon-wpchat-livechat-customer-support') : __('hours', 'smashballoon-wpchat-livechat-customer-support')} ${mins} ${__('minutes', 'smashballoon-wpchat-livechat-customer-support')}`;
		}
	} else if (minutes < 720) { // 2-12 hours
		// Round to nearest half hour (leaning higher)
		const hours = Math.ceil(minutes / 30) * 0.5;
		return `${hours} ${hours === 1 ? __('hour', 'smashballoon-wpchat-livechat-customer-support') : __('hours', 'smashballoon-wpchat-livechat-customer-support')}`;
	} else {
		// 12+ hours: use specific day format
		// Use the backend time string directly (already in WordPress timezone)
		const timeStr = formatTimeString(offHoursData.next_available_utc.time);
		const dayName = offHoursData.next_available_utc.day;

		// Check if it's tomorrow or a specific day
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowDayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

		if (dayName && dayName.toLowerCase() === tomorrowDayName.toLowerCase()) {
			return `${__('tomorrow at', 'smashballoon-wpchat-livechat-customer-support')} ${timeStr}`;
		} else if (dayName) {
			return `${__('on', 'smashballoon-wpchat-livechat-customer-support')} ${dayName} ${__('at', 'smashballoon-wpchat-livechat-customer-support')} ${timeStr}`;
		} else {
			// Fallback if day is not provided
			return `${__('tomorrow at', 'smashballoon-wpchat-livechat-customer-support')} ${timeStr}`;
		}
	}
}

/**
 * Format today's business hours using backend times directly.
 *
 * @param {Object} generalHours General working hours data.
 * @returns {string} Formatted business hours.
 */
function formatTodayBusinessHours(generalHours) {
	if (!generalHours) {
		return __('during business hours', 'smashballoon-wpchat-livechat-customer-support');
	}

	// Use backend times directly without timezone conversion
	const startFormatted = formatTimeString(generalHours.start);
	const endFormatted = formatTimeString(generalHours.end);

	// Get timezone abbreviation if available
	const timezone = generalHours.wp_timezone || 'UTC';
	const timezoneAbbr = getTimezoneAbbreviation(timezone);

	return `${__('from', 'smashballoon-wpchat-livechat-customer-support')} ${startFormatted}–${endFormatted} (${timezoneAbbr})`;
}

/**
 * Get timezone abbreviation from IANA timezone string.
 *
 * @param {string} timezone IANA timezone string.
 * @returns {string} Timezone abbreviation.
 */
function getTimezoneAbbreviation(timezone) {
	try {
		// Use a date in January to avoid DST issues
		const date = new Date(Date.UTC(2020, 0, 1, 12, 0, 0));
		const timeString = date.toLocaleTimeString('en-US', { timeZone: timezone, timeZoneName: 'short' });
		const parts = timeString.split(' ');
		const tz = parts[parts.length - 1];
		// Only return if it's not AM/PM
		if (tz === 'AM' || tz === 'PM') return timezone;
		return tz;
	} catch (e) {
		return timezone;
	}
}

/**
 * Format time string from HH:MM or HH:MM:SS to 12-hour format.
 *
 * @param {string} timeString Time string in HH:MM or HH:MM:SS format.
 * @returns {string} Formatted time string.
 */
function formatTimeString(timeString) {
	if (!timeString) return '';

	// Extract hours and minutes from HH:MM or HH:MM:SS format
	const parts = timeString.split(':');
	if (parts.length >= 2) {
		const hours = parseInt(parts[0], 10);
		const minutes = parts[1];

		// Convert to 12-hour format
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

		return `${displayHours}:${minutes} ${period}`;
	}

	return timeString;
}
