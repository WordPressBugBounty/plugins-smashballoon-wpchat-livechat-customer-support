import { createRoot } from 'react-dom/client';
import React from 'react';
import FrontendShadow from './Frontend';
import { createChatStore } from '@FDataStore/Chat/chatStoreFactory';
import { ChatStoreProvider } from '@Frontend/context/ChatStoreContext';
import useSettingsStore from '@DataStore/settings/settingsStore';
import themePresets from '@FDataStore/Themes/ThemePresets';

// Get RTL direction from WordPress HTML element
const isRTL = document.documentElement.dir === 'rtl';

/**
 * Initialize settings and hydrate a store instance.
 * @param {Function} store - The Zustand store instance
 */
async function initializeStoreSettings(store) {
  const { fetchSettings } = useSettingsStore.getState();
  const hydrateFromSettings = store.getState().hydrateFromSettings;

  await fetchSettings();

  const latestSettings = useSettingsStore.getState().settings;
  if (latestSettings?.customizerSettings) {
    // Apply theme defaults first if a theme is set
    if (latestSettings.customizerSettings.theme) {
      themePresets(latestSettings.customizerSettings.theme, store);
    }

    // Then override with custom settings
    hydrateFromSettings(latestSettings.customizerSettings);
  }
}

/**
 * Apply data attributes from DOM element to store.
 * @param {HTMLElement} element - The DOM element with data attributes
 * @param {Function} store - The Zustand store instance
 */
function applyDataAttributes(element, store) {
  const state = store.getState();

  const disableFixed = element.getAttribute('data-disable-fixed') === 'true';
  const showChat = element.getAttribute('data-show-chat') === 'true';
  const disableChatToggle = element.getAttribute('data-disable-chat-toggle') === 'true';

  if (disableFixed) {
    state.setDisableFixed(true);
  }
  if (showChat) {
    state.setShowChat(true);
  }
  if (disableChatToggle) {
    state.setDisableChatToggle(true);
  }

  // Set RTL direction in store for Shadow DOM
  if (isRTL) {
    state.setIsRTL(true);
  }
}

/**
 * Mount a chat widget instance to a DOM element.
 * @param {HTMLElement} element - The DOM element to mount to
 * @param {string} instanceId - Unique identifier for this instance
 * @param {string} instanceType - Type of instance ('floating' or 'shortcode')
 */
async function mountInstance(element, instanceId, instanceType) {
  // Create isolated store for this instance
  const store = createChatStore(instanceId, instanceType);

  // Initialize settings
  await initializeStoreSettings(store);

  // Apply data attributes
  applyDataAttributes(element, store);

  // Render the app
  const root = createRoot(element);
  root.render(
    <ChatStoreProvider store={store}>
      <FrontendShadow />
    </ChatStoreProvider>
  );
}

/**
 * Discover and mount all chat widget instances on the page.
 */
async function discoverAndMountInstances() {
  const mountPromises = [];

  // Find floating button element
  const floatingElement = document.getElementById('wp-chat-floating');
  if (floatingElement) {
    mountPromises.push(mountInstance(floatingElement, 'floating', 'floating'));
  }

  // Find all shortcode elements
  const shortcodeElements = document.querySelectorAll('[id^="wp-chat-shortcode-"]');
  shortcodeElements.forEach((element) => {
    const instanceId = element.id; // e.g., 'wp-chat-shortcode-1'
    mountPromises.push(mountInstance(element, instanceId, 'shortcode'));
  });

  // Wait for all instances to mount
  await Promise.all(mountPromises);
}

// Initialize all instances
discoverAndMountInstances();