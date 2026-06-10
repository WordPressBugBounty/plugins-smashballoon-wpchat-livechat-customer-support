/**
 * Conversation storage utility for persisting chat messages.
 * Uses localStorage for data (shared across tabs).
 * Clears when PHP session expires (browser close or session timeout).
 * Supports multiple independent widget instances via instanceId.
 */

const STORAGE_KEY_PREFIX = 'wpchat_conversation_history';
const SESSION_ID_KEY_PREFIX = 'wpchat_session_id';

/**
 * Get storage key for a specific instance.
 * @param {string} instanceId - The instance identifier.
 * @returns {string} The storage key.
 */
const getStorageKey = (instanceId) => {
  if (!instanceId || instanceId === 'default') {
    return STORAGE_KEY_PREFIX;
  }
  return `${STORAGE_KEY_PREFIX}_${instanceId}`;
};

/**
 * Get session ID key for a specific instance.
 * @param {string} instanceId - The instance identifier.
 * @returns {string} The session ID key.
 */
const getSessionIdKey = (instanceId) => {
  if (!instanceId || instanceId === 'default') {
    return SESSION_ID_KEY_PREFIX;
  }
  return `${SESSION_ID_KEY_PREFIX}_${instanceId}`;
};

/**
 * Safely set item in localStorage, handling quota and availability errors.
 * @param {string} key - Storage key.
 * @param {string} value - Value to store.
 * @returns {boolean} True if successful.
 */
const safeSetItem = (key, value) => {
	try {
		localStorage.setItem(key, value);
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * Clear all conversation data for a specific instance.
 * @param {string} instanceId - The instance identifier.
 * @returns {void}
 */
const clearAllConversations = (instanceId) => {
	const storageKey = getStorageKey(instanceId);
	localStorage.removeItem(storageKey);
	localStorage.removeItem(storageKey + '_archive');
};

/**
 * Check if PHP session has changed (expired or new session).
 * @param {string} instanceId - The instance identifier.
 * @returns {boolean} True if session has changed.
 */
const isSessionChanged = (instanceId) => {
	const currentSessionId = window.wpChatFrontend?.sessionId;
	if (!currentSessionId) return false;

	const sessionIdKey = getSessionIdKey(instanceId);
	const storedSessionId = localStorage.getItem(sessionIdKey);
	if (!storedSessionId) {
		// First visit - store session ID
		safeSetItem(sessionIdKey, currentSessionId);
		return false;
	}

	if (storedSessionId !== currentSessionId) {
		// Session changed - update stored ID
		safeSetItem(sessionIdKey, currentSessionId);
		return true;
	}

	return false;
};

/**
 * Move current conversation to archive (append to existing archive).
 * @param {string} instanceId - The instance identifier.
 * @returns {void}
 */
const moveCurrentToArchive = (instanceId) => {
	const storageKey = getStorageKey(instanceId);
	const current = localStorage.getItem(storageKey);
	if (!current) return;

	try {
		const currentData = JSON.parse(current);
		const currentMessages = currentData.messages || [];
		if (currentMessages.length === 0) return;

		const existingArchive = localStorage.getItem(storageKey + '_archive');
		let archivedMessages = [];
		let archivedDate = currentData.displayDate;

		if (existingArchive) {
			const archiveData = JSON.parse(existingArchive);
			archivedMessages = archiveData.messages || [];
			archivedDate = archiveData.displayDate || archivedDate;
		}

		const newArchive = {
			messages: [...archivedMessages, ...currentMessages],
			displayDate: archivedDate || getCurrentDateString(),
		};
		safeSetItem(storageKey + '_archive', JSON.stringify(newArchive));
		localStorage.removeItem(storageKey);
	} catch (e) {
		// Ignore parse errors
	}
};

/**
 * Clear data if PHP session changed. Call on page load.
 * @param {string} instanceId - The instance identifier.
 * @returns {void}
 */
export const clearExpiredData = (instanceId = 'default') => {
	if (isSessionChanged(instanceId)) {
		clearAllConversations(instanceId);
	}
};

/**
 * Initialize session - moves current messages to archive.
 * @param {string} instanceId - The instance identifier.
 * @returns {void}
 */
export const initSession = (instanceId = 'default') => {
	moveCurrentToArchive(instanceId);
};

/**
 * Format current time as "8:52pm" string.
 * @returns {string} Formatted time string.
 */
const getCurrentTimeString = () => {
	const now = new Date();
	let hours = now.getHours();
	const minutes = now.getMinutes();
	const ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12 || 12;
	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
	return `${hours}:${formattedMinutes}${ampm}`;
};

/**
 * Format current date as "Wed, 18 Dec" string.
 * @returns {string} Formatted date string.
 */
const getCurrentDateString = () => {
	const now = new Date();
	return now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

/**
 * Check if a message can be serialized to JSON.
 * @param {Object} msg - Message object.
 * @returns {boolean} True if message can be serialized.
 */
const isSerializable = (msg) => {
	if (!msg) return false;
	if (typeof msg.message !== 'string' && !(msg.type && msg.data)) return false;
	try {
		// Strip non-serializable fields before checking
		const { storeApi, ...rest } = msg;
		JSON.stringify(rest);
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * Save current conversation to localStorage.
 * @param {Array} messages - Array of message objects.
 * @param {string} instanceId - The instance identifier.
 * @returns {void}
 */
export const saveConversation = (messages, instanceId = 'default') => {
	if (!messages || messages.length === 0) return;

	const serializableMessages = messages.filter(isSerializable);
	if (serializableMessages.length === 0) return;

	const messagesWithTime = serializableMessages.map((msg) => {
		// Strip non-serializable fields (e.g. storeApi from platform_links messages)
		const { storeApi, ...rest } = msg;
		return {
			...rest,
			displayTime: msg.displayTime || getCurrentTimeString(),
		};
	});

	const data = {
		messages: messagesWithTime,
		displayDate: getCurrentDateString(),
	};
	safeSetItem(getStorageKey(instanceId), JSON.stringify(data));
};

/**
 * Check if old (archived) conversations exist.
 * @param {string} instanceId - The instance identifier.
 * @returns {boolean} True if archived conversations exist.
 */
export const hasOldConversations = (instanceId = 'default') => {
	return !!localStorage.getItem(getStorageKey(instanceId) + '_archive');
};

/**
 * Get archived (old) conversations from previous session.
 * @param {string} instanceId - The instance identifier.
 * @returns {Array|null} Array of messages or null if none exist.
 */
export const getOldConversations = (instanceId = 'default') => {
	const data = localStorage.getItem(getStorageKey(instanceId) + '_archive');
	if (!data) return null;

	try {
		const parsed = JSON.parse(data);
		return parsed.messages || null;
	} catch (e) {
		return null;
	}
};

/**
 * Get the display date of archived conversations.
 * @param {string} instanceId - The instance identifier.
 * @returns {string|null} Formatted date string or null if no archived conversations.
 */
export const getOldConversationsDisplayDate = (instanceId = 'default') => {
	const data = localStorage.getItem(getStorageKey(instanceId) + '_archive');
	if (!data) return null;

	try {
		const parsed = JSON.parse(data);
		return parsed.displayDate || null;
	} catch (e) {
		return null;
	}
};
