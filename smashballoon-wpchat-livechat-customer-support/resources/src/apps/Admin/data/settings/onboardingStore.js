import { create } from 'zustand';
import { wpChatAPI } from '@Utils/apiHelper';
import useLicenseStore from '../license/licenseStore';
import { isPro } from '@Utils/isPro';

const useOnboardingStore = create((set, get) => ({
  // Simple draft state
  agentPlatforms: {
    whatsapp: { enabled: false, value: '' },
    instagram: { enabled: false, value: '' },
    telegram: { enabled: false, value: '' },
    messenger: { enabled: false, value: '' }
  },
  selectedTheme: null,
  visibilitySettings: {
    mode: 'include',
    exclude: { pages: [], categories: [], tags: [], postTypes: [] },
    include: { pages: [], categories: [], tags: [], postTypes: [] }
  },
  // License and newsletter fields
  licenseKey: '',
  newsletterEmail: window.wpChatAdmin?.adminEmail || '',
  newsletterSubscribed: true,

  // Internal state
  settings: null,
  saveStatus: null,
  isSettingsFetched: false,

  // Actions
  updateField: (fieldName, value) => {
    // For license key, also update the license store
    if (fieldName === 'licenseKey') {
      const licenseStore = useLicenseStore.getState();
      licenseStore.setLicenseKey(value);
    }
    set({ [fieldName]: value });
  },

  // Fetch settings internally
  fetchSettings: async () => {
    if (get().isSettingsFetched) {
      return get().settings;
    }

    try {
      const nonce = window.wpChatFrontend?.frontendNonce || window.wpChatAdmin?.restNonce || '';
      const context = window.wpChatFrontend ? 'frontend' : 'admin';
      
      const data = await wpChatAPI.get('settings', { nonce }, context);
      set({ settings: data || {}, isSettingsFetched: true });
      return data || {};
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      throw error;
    }
  },

  // Initialize from fetched settings
  init: async () => {
    try {
      const settings = await get().fetchSettings();
      if (settings) {
        const agentPlatforms = settings.agentSettings?.platforms || {
          whatsapp: { enabled: false, value: '' },
          instagram: { enabled: false, value: '' },
          telegram: { enabled: false, value: '' },
          messenger: { enabled: false, value: '' }
        };

        set({
          agentPlatforms,
          selectedTheme: settings.customizerSettings?.theme || null,
          visibilitySettings: settings.visibilitySettings || get().visibilitySettings,
          // Get license key from license store
          licenseKey: useLicenseStore.getState().licenseKey || '',
          newsletterEmail: window.wpChatAdmin?.adminEmail || '',
          newsletterSubscribed: true // Default to subscribed
        });
      }
    } catch (error) {
      console.error('Error initializing onboarding:', error);
    }
  },

  // Common settings data preparation
  _prepareOnboardingSettings: () => {
    const state = get();
    // Merge with existing customizerSettings to preserve other values
    const existingCustomizerSettings = state.settings?.customizerSettings || {};
    const existingAgentSettings = state.settings?.agentSettings || {};

    // Merge agent platforms into agentSettings.platforms
    // Deep merge to preserve platforms not in onboarding flow (e.g., Pro platforms)
    const existingPlatforms = existingAgentSettings.platforms || {};
    const updatedAgentPlatforms = { ...existingPlatforms, ...state.agentPlatforms };

    return {
      agentSettings: {
        ...existingAgentSettings,
        platforms: updatedAgentPlatforms
      },
      customizerSettings: {
        ...existingCustomizerSettings,
        theme: state.selectedTheme
      },
      visibilitySettings: state.visibilitySettings,
      onboardingStatus: true
    };
  },

  // Common settings save logic
  _saveSettingsData: async (settingsData, options = {}) => {
    const { updateSaveStatus = false, logError = true } = options;
    const state = get();
    
    try {
      const updatedData = { ...state.settings, ...settingsData };
      const response = await wpChatAPI.post('settings', updatedData);
      
      if (response && response.status === 200) {
        const stateUpdate = {
          settings: { ...state.settings, ...updatedData }
        };
        
        if (updateSaveStatus) {
          stateUpdate.saveStatus = 'success';
        }
        
        set(() => stateUpdate);
        return { success: true, data: updatedData };
      } else {
        if (updateSaveStatus) {
          set({ saveStatus: 'error' });
        }
        if (logError) {
          console.error('Settings update failed:', response);
        }
        return { success: false, error: 'Settings update failed' };
      }
    } catch (error) {
      if (updateSaveStatus) {
        set({ saveStatus: 'error' });
      }
      if (logError) {
        console.error('Error saving settings:', error);
      }
      return { success: false, error: error.message || 'Unknown error' };
    }
  },

  // Handle newsletter subscription (only for free users)
  _handleNewsletterSubscription: async () => {
    // Skip newsletter subscription for Pro users
    if (isPro) {
      return { success: true, skipped: true };
    }

    const state = get();
    if (!state.newsletterSubscribed || !state.newsletterEmail) {
      return { success: true, skipped: true };
    }

    try {
      await wpChatAPI.post('wpchat-api/register-and-collect', {
        email: state.newsletterEmail,
        additionalData: {
          source: 'onboarding_completion'
        }
      });
      console.log('User registration and newsletter subscription successful');
      return { success: true };
    } catch (error) {
      console.error('User registration and newsletter subscription failed:', error);
      // Don't fail the entire onboarding if newsletter fails
      return { success: false, error: error.message };
    }
  },

  // Save only onboarding status (for exit setup)
  saveOnboardingStatus: async () => {
    try {
      const onboardingSettings = get()._prepareOnboardingSettings();
      const result = await get()._saveSettingsData(onboardingSettings, { 
        updateSaveStatus: false, 
        logError: true 
      });
      
      return result.success;
    } catch (error) {
      console.error('Error in saveOnboardingStatus:', error);
      return false;
    }
  },

  // Save settings internally (full completion flow)
  saveSettings: async () => {
    set({ saveStatus: null });
    
    try {
      // Save core onboarding settings
      const onboardingSettings = get()._prepareOnboardingSettings();
      const saveResult = await get()._saveSettingsData(onboardingSettings, { 
        updateSaveStatus: true, 
        logError: true 
      });
      
      if (!saveResult.success) {
        return false;
      }

      // Handle newsletter subscription (doesn't affect main flow)
      await get()._handleNewsletterSubscription();

      return true;
    } catch (error) {
      set({ saveStatus: 'error' });
      console.error('Error in saveSettings:', error);
      return false;
    }
  }
}));

export default useOnboardingStore;