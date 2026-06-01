import { createChatStore, persistableKeys } from './chatStoreFactory';
import useSettingsStore from '@DataStore/settings/settingsStore';

/**
 * Default chat store instance for admin/preview mode.
 * This maintains backward compatibility with existing admin components
 * that import useChatStore directly from this file.
 *
 * Frontend multi-instance mode uses createChatStore from chatStoreFactory.js
 * and provides stores via ChatStoreContext.
 */
export const useChatStore = createChatStore('default', 'preview');

export async function chatSettingsInitializer() {
  const { fetchSettings } = useSettingsStore.getState();
  const hydrateFromSettings = useChatStore.getState().hydrateFromSettings;

  await fetchSettings(); // Wait for settings to load

  const latestSettings = useSettingsStore.getState().settings;
  if (latestSettings?.customizerSettings) {
    // Apply theme defaults first if a theme is set
    if (latestSettings.customizerSettings.theme) {
      const ThemePresets = (await import('@FDataStore/Themes/ThemePresets')).default;
      ThemePresets(latestSettings.customizerSettings.theme);
    }

    // Then override with custom settings
    hydrateFromSettings(latestSettings.customizerSettings);
  }
}
export function chatSettingsSaver() {
  const { settings, saveSettings } = useSettingsStore.getState();
  const chatState = useChatStore.getState();

  const customizerSettings = {};

  // Only save the keys that are explicitly marked as persistable
  persistableKeys.forEach(key => {
    if (chatState[key] !== undefined) {
      customizerSettings[key] = chatState[key];
    }
  });

  if (Object.keys(customizerSettings).length === 0 && Object.keys(settings).length === 0) {
    return Promise.resolve();
  }

  const payload = {
    ...settings,
    customizerSettings,
  };

  return saveSettings(payload);
}
