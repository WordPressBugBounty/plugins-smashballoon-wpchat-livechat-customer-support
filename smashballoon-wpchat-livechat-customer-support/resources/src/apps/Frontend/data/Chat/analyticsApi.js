import bufferManager from './AnalyticsBufferManager';
import { useChatStore } from './chatStore';

/**
 * Log an event to the analytics system using the buffer manager.
 *
 * @param {string} eventType The type of event to log.
 * @param {Object} data The event data.
 * @param {Object} context Additional context data.
 */
export const logEvent = (eventType, data = {}, context = {}) => {
	// Skip logging if in preview mode (backend admin preview)
	const isPreviewMode = useChatStore.getState().isPreviewMode;
	if (isPreviewMode) {
		return;
	}

	bufferManager.addEvent(eventType, data, context);
};

/**
 * Log multiple events in batch (for high-frequency events like FAQ search appearances)
 *
 * @param {Array} events Array of events with {eventType, eventData, context}
 */
export const logBatchEvents = (events) => {
	// Skip logging if in preview mode (backend admin preview)
	const isPreviewMode = useChatStore.getState().isPreviewMode;
	if (isPreviewMode) {
		return;
	}

	bufferManager.addBatchEvents(events);
};

/**
 * Log FAQ helpful rating event
 * @param {number} faqId - The FAQ ID
 * @param {string} faqQuestion - The FAQ question text  
 * @param {Object} metadata - Additional event metadata
 */
export const logFaqHelpful = (faqId, faqQuestion, metadata = {}) => {
	logEvent('FAQ_HELPFUL', {
		faq_id: faqId,
		faq_question: faqQuestion,
		...metadata,
	});
};

/**
 * Log FAQ not helpful rating event
 * @param {number} faqId - The FAQ ID
 * @param {string} faqQuestion - The FAQ question text
 * @param {Object} metadata - Additional event metadata (including feedback)
 */
export const logFaqNotHelpful = (faqId, faqQuestion, metadata = {}) => {
	logEvent('FAQ_NOT_HELPFUL', {
		faq_id: faqId,
		faq_question: faqQuestion,
		...metadata,
	});
};



/**
 * Log enhanced navigation event with context intelligence
 * @param {string} fromSection - The section navigated from
 * @param {string} toSection - The section navigated to
 * @param {Object} metadata - Enhanced navigation metadata
 * @param {string} metadata.navigation_type - Type of navigation (menu_click, cta_button, back_button, etc.)
 * @param {string} metadata.navigation_trigger - UI element that triggered navigation
 * @param {string} metadata.trigger_type - Explicit trigger type override
 * @param {Object} metadata.additional - Any additional context data
 */
export const logNavigation = (fromSection, toSection, metadata = {}) => {
	// Enhance navigation context automatically
	const enhancedMetadata = {
		from_section: fromSection,
		to_section: toSection,
		navigation_type: metadata.navigation_type || inferNavigationType(fromSection, toSection, metadata),
		page_url: window.location.href,
		...metadata,
	};

	logEvent('NAVIGATION', enhancedMetadata);
};

/**
 * Infer navigation type based on context clues
 * @private
 */
const inferNavigationType = (fromSection, toSection, metadata) => {
	// Use explicit trigger type if provided
	if (metadata.trigger_type) {
		return metadata.trigger_type;
	}

	// Infer from UI context
	if (metadata.navigation_trigger) {
		const trigger = metadata.navigation_trigger.toLowerCase();
		if (trigger.includes('button')) return 'cta_button';
		if (trigger.includes('menu')) return 'menu_click';
		if (trigger.includes('back')) return 'back_button';
		if (trigger.includes('tab')) return 'tab_switch';
	}

	// Infer from section patterns
	if (fromSection === toSection) return 'page_refresh';
	if (toSection === 'home') return 'back_button';
	if (fromSection === 'home') return 'menu_click';

	return 'direct_navigation';
};

/**
 * Helper function for logging CTA button navigation
 * @param {string} fromSection - The section navigated from
 * @param {string} toSection - The section navigated to
 * @param {string} buttonText - Text or identifier of the button clicked
 */
export const logCTANavigation = (fromSection, toSection, buttonText) => {
	logNavigation(fromSection, toSection, {
		navigation_type: 'cta_button',
		navigation_trigger: buttonText,
		trigger_type: 'cta_button',
	});
};

/**
 * Helper function for logging back button navigation
 * @param {string} fromSection - The section navigated from
 * @param {string} toSection - The section navigated to
 */
export const logBackNavigation = (fromSection, toSection) => {
	logNavigation(fromSection, toSection, {
		navigation_type: 'back_button',
		navigation_trigger: 'back_button',
		trigger_type: 'back_button',
	});
};

/**
 * Helper function for logging menu click navigation
 * @param {string} fromSection - The section navigated from
 * @param {string} toSection - The section navigated to
 * @param {string} menuItem - Menu item clicked
 */
export const logMenuNavigation = (fromSection, toSection, menuItem = '') => {
	logNavigation(fromSection, toSection, {
		navigation_type: 'menu_click',
		navigation_trigger: menuItem || 'menu_item',
		trigger_type: 'menu_click',
	});
};

/**
 * Log a chat open event.
 *
 * @param {string} source The source that triggered the chat open.
 */
export const logChatOpen = (source = 'chat_widget') => {
	logEvent('BOT_OPEN', { source });
};

/**
 * Log a chat close event.
 *
 * @param {string} reason The reason for closing.
 */
export const logChatClose = (reason = 'user_action') => {
	logEvent('BOT_CLOSE', { reason });
};

/**
 * Log a message send event.
 *
 * @param {string} message The message.
 */
export const logMessageSend = (message) => {
	logEvent('MESSAGE_SEND', {
		message: message,
	});
};

/**
 * Log an FAQ search event.
 *
 * @param {string} searchTerm The search term used.
 * @param {number} resultsCount The number of results found.
 */
export const logFaqSearch = (searchTerm, resultsCount = 0) => {
	logEvent('FAQ_SEARCH', {
		search_term: searchTerm,
		results_count: resultsCount
	});
};

/**
 * Log multiple FAQ search appearance events in batch (efficient for search results).
 *
 * @param {Array} faqs Array of FAQ objects with id and question properties.
 * @param {string} searchTerm The search term used.
 */
export const logFaqSearchAppearances = (faqs, searchTerm) => {
	if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
		return;
	}

	const appearanceEvents = faqs
		.filter(faq => faq.id)
		.map(faq => ({
			eventType: 'FAQ_SEARCH_APPEARANCE',
			eventData: {
				faq_id: faq.id,
				faq_question: faq.question,
				search_term: searchTerm
			},
			context: {}
		}));
	
	if (appearanceEvents.length > 0) {
		logBatchEvents(appearanceEvents);
	}
};

/**
 * Log an FAQ click event.
 *
 * @param {number} faqId The FAQ ID that was clicked.
 * @param {string} source The source of the click.
 */
export const logFaqClick = (faqId, faqQuestion, source = 'list') => {
	logEvent('FAQ_CLICK', {
		faq_id: faqId,
		faq_question: faqQuestion,
		source
	});
};

/**
 * Get analytics buffer status for debugging
 */
export const getAnalyticsStatus = () => {
	return bufferManager.getStatus();
};

/**
 * Manually flush the analytics buffer (for testing)
 */
export const flushAnalyticsBuffer = () => {
	return bufferManager.flush();
};

/**
 * Clear analytics buffer and storage (for testing/reset)
 */
export const clearAnalyticsBuffer = () => {
	return bufferManager.clear();
};

/**
 * Log a funnel view event when a funnel is displayed.
 *
 * @param {number|string} funnelId The funnel ID
 * @param {string} funnelName The funnel name
 * @param {Object} metadata Additional metadata
 */
export const logFunnelView = (funnelId, funnelName, metadata = {}) => {
	logEvent('FUNNEL_STEP', {
		funnel_id: funnelId,
		funnel_name: funnelName,
		step_name: 'view',
		step_type: 'view',
		block_order: metadata.starting_block || 1,
		...metadata
	});
};

/**
 * Log a funnel step event when user interacts with a funnel block.
 *
 * @param {number|string} funnelId The funnel ID
 * @param {string} funnelName The funnel name
 * @param {number} blockOrder The order of the block in the funnel
 * @param {string} stepName The name/type of the step (e.g., 'option_click', 'message_view')
 * @param {Object} metadata Additional metadata including option details
 */
export const logFunnelStep = (funnelId, funnelName, blockOrder, stepName, metadata = {}) => {
	logEvent('FUNNEL_STEP', {
		funnel_id: funnelId,
		funnel_name: funnelName,
		step_name: stepName,
		step_type: 'interaction',
		block_order: blockOrder,
		...metadata
	});
};

/**
 * Log a funnel option click event.
 *
 * @param {number|string} funnelId The funnel ID
 * @param {string} funnelName The funnel name
 * @param {number} blockOrder The order of the block
 * @param {string} optionText The text of the clicked option
 * @param {string} actionType The type of action ('block' or 'support')
 * @param {Object} metadata Additional metadata
 */
export const logFunnelOptionClick = (funnelId, funnelName, blockOrder, optionText, actionType, metadata = {}) => {
	logEvent('FUNNEL_STEP', {
		funnel_id: funnelId,
		funnel_name: funnelName,
		step_name: 'option_click',
		step_type: 'interaction',
		block_order: blockOrder,
		option_text: optionText,
		action_type: actionType,
		...metadata
	});
};

/**
 * Log a funnel completion event when user reaches the end or completes the funnel.
 *
 * @param {number|string} funnelId The funnel ID
 * @param {string} funnelName The funnel name
 * @param {number} totalSteps The total number of steps completed
 * @param {string} completionType The type of completion ('end_reached', 'converted', 'redirected')
 * @param {Object} metadata Additional metadata
 */
export const logFunnelComplete = (funnelId, funnelName, totalSteps, completionType = 'end_reached', metadata = {}) => {
	logEvent('FUNNEL_COMPLETE', {
		funnel_id: funnelId,
		funnel_name: funnelName,
		total_steps: totalSteps,
		completion_type: completionType,
		...metadata
	});
};

/**
 * Log a funnel abandon event when user leaves without completing.
 *
 * @param {number|string} funnelId The funnel ID
 * @param {string} funnelName The funnel name
 * @param {number} lastBlockOrder The last block order user interacted with
 * @param {string} abandonReason The reason for abandonment
 * @param {Object} metadata Additional metadata
 */
export const logFunnelAbandon = (funnelId, funnelName, lastBlockOrder, abandonReason = 'user_exit', metadata = {}) => {
	logEvent('FUNNEL_ABANDON', {
		funnel_id: funnelId,
		funnel_name: funnelName,
		last_block_order: lastBlockOrder,
		abandon_reason: abandonReason,
		...metadata
	});
};

// Note: REDIRECT_TO_PLATFORM logging is handled by backend ChatPlatformEndpoint
// when a platform redirect occurs, with proper source and funnel_id tracking
