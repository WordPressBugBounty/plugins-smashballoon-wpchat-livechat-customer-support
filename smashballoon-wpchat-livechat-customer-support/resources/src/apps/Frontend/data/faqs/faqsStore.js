import { create } from 'zustand';
import { __ } from '@wordpress/i18n';
import { fetchInitialFaqs, searchFaqs, trackFaqClick } from './faqsApi';

const useFaqsStore = create((set, get) => ({
  // State
  faqs: [],
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  searchError: null,
  initialLoadComplete: false,
  trackingClick: false,
  totalFaqs: 0,
  currentPage: 1,

  // Actions
  loadInitialFaqs: async (limit = 5, offset = 0) => {
    // Return cached FAQs if already loaded and no pagination
    if (get().initialLoadComplete && offset === 0) {
      return {
        faqs: get().faqs,
        totalFaqs: get().totalFaqs,
        currentPage: get().currentPage
      };
    }

    try {
      set({ loading: true, error: null });
      const response = await fetchInitialFaqs(limit, offset);

      if (response && response.faqs) {
        set(state => ({
          faqs: offset === 0 ? response.faqs : [...state.faqs, ...response.faqs],
          loading: false,
          initialLoadComplete: true,
          totalFaqs: response.total_faqs || 0,
          currentPage: Math.floor(offset / limit) + 1
        }));
        return response;
      }
    } catch (error) {
      console.error('Error in loadInitialFaqs:', error);
      set({
        error: __('[WPC-FAQ-006] Error loading FAQs', 'smashballoon-wpchat-livechat-customer-support'),
        loading: false
      });
      throw error;
    }
  },

  searchFaqs: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false, searchError: null });
      return;
    }

    try {
      set({ searchLoading: true, searchError: null });
      const response = await searchFaqs(query);

      if (response && Array.isArray(response)) {
        set({
          searchResults: response,
          searchLoading: false
        });
        return response;
      } else {
        set({
          searchResults: [],
          searchLoading: false,
          searchError: __('No results found.', 'smashballoon-wpchat-livechat-customer-support')
        });
      }
    } catch (error) {
      console.error('Error in searchFaqs:', error);
      set({
        searchError: __('[WPC-FAQ-007] Error searching FAQs', 'smashballoon-wpchat-livechat-customer-support'),
        searchLoading: false,
        searchResults: []
      });
      throw error;
    }
  },

  clearSearch: () => {
    set({
      searchResults: [],
      searchError: null,
      searchLoading: false
    });
  },

  trackFaqClick: async (faqId, faqQuestion) => {
    if (get().trackingClick) {
      return;
    }

    try {
      set({ trackingClick: true });
      await trackFaqClick(faqId, faqQuestion);
    } catch (error) {
      console.error('Error tracking FAQ click:', error);
      throw error;
    } finally {
      set({ trackingClick: false });
    }
  },

  // Selectors
  getFaqById: (id) => {
    const { faqs, searchResults } = get();
    return [...faqs, ...searchResults].find(faq => faq.id === id);
  },

  getInitialFaqs: () => {
    return get().faqs;
  },

  getSearchResults: () => {
    return get().searchResults;
  },

  isLoading: () => {
    return get().loading;
  },

  isSearching: () => {
    return get().searchLoading;
  },

  isTrackingClick: () => {
    return get().trackingClick;
  },

  getError: () => {
    return get().error;
  },

  getSearchError: () => {
    return get().searchError;
  },

  // Reset cache to force reload - used by Admin store when FAQs are modified
  resetCache: () => {
    set({
      initialLoadComplete: false,
      faqs: [],
      totalFaqs: 0,
      currentPage: 1
    });
  }
}));

export default useFaqsStore;
