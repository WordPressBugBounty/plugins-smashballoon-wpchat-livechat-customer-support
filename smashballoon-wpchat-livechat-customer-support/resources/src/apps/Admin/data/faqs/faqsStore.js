import { create } from 'zustand';
import {
  bulkDeleteFaqs,
  cloneFaq,
  createFaq,
  deleteFaq,
  fetchFaq,
  fetchFaqs,
  updateFaq,
} from './faqsApi';
import { fetchSettings, saveSettings } from '@DataStore/settings/settingsApi';
import useFrontendFaqsStore from '@FDataStore/faqs/faqsStore';

const useFaqsStore = create((set, get) => ({
  faqs: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalFaqs: 0
  },
  // Cache to store FAQs by page
  pageCache: {},
  // FAQ onboarding status
  faqOnboardingStatus: null, // null = not checked, true = dismissed, false = not dismissed

  loadFaqs: async (page = 1) => {
    // Prevent duplicate requests while one is already in progress
    if (get().loading) {
      return get().faqs;
    }

    try {
      const validPage = parseInt(page) || 1;

      // Check if we have cached data for this page
      const cachedData = get().pageCache[validPage];
      if (cachedData) {
        set({
          faqs: cachedData.faqs,
          pagination: cachedData.pagination
        });
        return cachedData.faqs;
      }

      set({ loading: true, error: null });
      const response = await fetchFaqs(validPage);
      
      // Cache the response data
      const pageData = {
        faqs: response.faqs || [],
        pagination: {
          currentPage: response.current_page || validPage,
          totalPages: response.total_pages || 1,
          totalFaqs: response.total_faqs || 0
        }
      };

      set({
        faqs: pageData.faqs,
        loading: false,
        pagination: pageData.pagination,
        pageCache: {
          ...get().pageCache,
          [validPage]: pageData
        }
      });
      return pageData.faqs;
    } catch (error) {
      console.error('Error in loadFaqs:', error);
      set({
        error: 'Error fetching FAQs',
        loading: false,
        faqs: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalFaqs: 0
        }
      });
      return [];
    }
  },

  loadFaq: async (id) => {
    const existingFaq = get().faqs.find((faq) => faq.id == id);
    if (existingFaq) {
      return existingFaq;
    }

    set({ loading: true, error: null });
    try {
      const faq = await fetchFaq(id);
      return faq;
    } catch (error) {
      set({ error: 'Error fetching FAQ', loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Clear cache when data is modified
  clearCache: () => {
    set({ pageCache: {} });
  },

  addFaq: async (faqData) => {
    try {
      set({ error: null });
      const faqId = await createFaq(faqData);
      if (faqId) {
        get().clearCache();
        useFrontendFaqsStore.getState().resetCache();
        await useFaqsStore.getState().loadFaqs();
        return faqId; // Return the created FAQ ID
      }
      return false;
    } catch (error) {
      console.error('Error in addFaq:', error);
      set({ error: 'Error creating FAQ' });
      throw error;
    }
  },

  editFaq: async (id, faqData) => {
    try {
      set({ error: null });
      const success = await updateFaq(id, faqData);
      if (success) {
        get().clearCache();
        useFrontendFaqsStore.getState().resetCache();
        await useFaqsStore.getState().loadFaqs();
      }
    } catch (error) {
      console.error('Error in editFaq:', error);
      set({ error: 'Error updating FAQ' });
      throw error;
    }
  },

  removeFaq: async (id) => {
    try {
      set({ error: null });
      const success = await deleteFaq(id);
      if (success) {
        get().clearCache();
        useFrontendFaqsStore.getState().resetCache();
        await useFaqsStore.getState().loadFaqs();
      }
    } catch (error) {
      console.error('Error in removeFaq:', error);
      set({ error: 'Error deleting FAQ' });
      throw error;
    }
  },

  cloneFaq: async (id) => {
    try {
      set({ error: null });
      const success = await cloneFaq(id);
      if (success) {
        get().clearCache();
        useFrontendFaqsStore.getState().resetCache();
        const currentPage = get().pagination.currentPage;
        await useFaqsStore.getState().loadFaqs(currentPage);
      }
    } catch (error) {
      console.error('Error in cloneFaq:', error);
      set({ error: 'Error cloning FAQ' });
      throw error;
    }
  },

  removeFaqs: async (ids) => {
    try {
      set({ error: null });
      const success = await bulkDeleteFaqs(ids);
      if (success) {
        get().clearCache();
        useFrontendFaqsStore.getState().resetCache();
        await useFaqsStore.getState().loadFaqs();
      }
    } catch (error) {
      console.error('Error in removeFaqs:', error);
      set({ error: 'Error deleting FAQs' });
      throw error;
    }
  },

  // FAQ Onboarding methods
  checkFaqOnboardingStatus: async () => {
    if (get().faqOnboardingStatus !== null) {
      return get().faqOnboardingStatus;
    }

    try {
      const settings = await fetchSettings();
      const status = settings.faqOnboardingStatus || false;
      set({ faqOnboardingStatus: status });
      return status;
    } catch (error) {
      console.error('Error checking FAQ onboarding status:', error);
      set({ faqOnboardingStatus: false });
      return false;
    }
  },

  dismissFaqOnboarding: async () => {
    try {
      const settings = await fetchSettings();
      await saveSettings({
        ...settings,
        faqOnboardingStatus: true
      });
      set({ faqOnboardingStatus: true });
      return true;
    } catch (error) {
      console.error('Error dismissing FAQ onboarding:', error);
      return false;
    }
  },

  // Reset loading state - useful for cleanup
  resetLoading: () => {
    set({ loading: false, error: null });
  },

  // Reset store to initial state
  resetStore: () => {
    set({
      faqs: [],
      loading: false,
      error: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalFaqs: 0
      },
      pageCache: {},
    });
  },
}));

export default useFaqsStore;