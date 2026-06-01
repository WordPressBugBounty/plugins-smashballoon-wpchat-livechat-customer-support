import { useEffect, useState } from 'react';
import { isPro } from '@Utils/isPro';
import useSettingsStore from '@DataStore/settings/settingsStore';

/**
 * Custom hook to determine if the pro upsell banner should be shown
 * 
 * @returns {Object} - Object containing shouldShowBanner boolean and dismissBanner function
 */
export function useProUpsellBanner() {
  const { settings, fetchSettings, saveSettings } = useSettingsStore();
  const [shouldShowBanner, setShouldShowBanner] = useState(false);
  const freeUser = !isPro;

  useEffect(() => {
    const loadSettings = async () => {
      if (!settings) {
        await fetchSettings();
      }
    };
    loadSettings();
  }, [settings, fetchSettings]);

  useEffect(() => {
    if (settings) {
      const proUpsellStatus = settings.proUpsellStatus !== undefined ? settings.proUpsellStatus : false;
      setShouldShowBanner(freeUser && !proUpsellStatus);
    }
  }, [settings, freeUser]);

  const dismissBanner = async () => {
    try {
      // Merge with existing settings to avoid clearing other data
      const updatedSettings = {
        ...settings,
        proUpsellStatus: true
      };
      await saveSettings(updatedSettings);
      setShouldShowBanner(false);
      return true;
    } catch (error) {
      console.error('Error dismissing pro upsell banner:', error);
      return false;
    }
  };

  return {
    shouldShowBanner,
    dismissBanner,
    isProUser: !freeUser,
    proUpsellStatus: settings?.proUpsellStatus
  };
}