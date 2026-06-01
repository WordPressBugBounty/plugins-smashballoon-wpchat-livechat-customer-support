import { create } from 'zustand';
import { fetchSettings, saveSettings } from './settingsApi';

const useSettingsStore = create((set, get) => ({
  settings: null,
  saveStatus: null,
  isSettingsFetched: false,
  loading: false,

  fetchSettings: async () => {
    // Return cached settings if already fetched
    if (get().isSettingsFetched) {
      return get().settings;
    }

    // Prevent concurrent requests
    if (get().loading) {
      // Wait for the current request to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!get().loading) {
            clearInterval(checkInterval);
            resolve(get().settings);
          }
        }, 50);
      });
    }

    set({ loading: true });
    try {
      const data = await fetchSettings();
      set({ settings: data, isSettingsFetched: true, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      console.error('Error in fetchSettings:', error);
      throw error;
    }
  },

  saveSettings: async (updatedData) => {
    set({ saveStatus: null });
    try {
      const response = await saveSettings(updatedData);
      if (response && response.status === 200) {
        set((state) => ({
          settings: { ...state.settings, ...updatedData },
          saveStatus: 'success',
        }));
        return true;
      } else {
        set({ saveStatus: 'error' });
        console.error('Settings update failed:', response);
        return false;
      }
    } catch (error) {
      set({ saveStatus: 'error' });
      console.error('Error in saveSettings:', error);
      return false;
    }
  },

  updateSettings: (updatedData) => {
    set((state) => ({
      ...state,
      ...updatedData,
    }));
  },

  resetLoading: () => {
    set({ loading: false });
  },
}));

export default useSettingsStore;
