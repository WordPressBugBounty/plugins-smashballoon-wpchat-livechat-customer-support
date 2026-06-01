import { create } from 'zustand';
import * as contentApi from './contentApi';

/**
 * Zustand store for managing content state (pages, categories, tags, post types)
 * Provides methods for fetching content from WordPress REST API
 */
const useContentStore = create((set) => ({
  // State
  pages: [],
  pagesLoading: false,
  pagesError: null,
  pagesMeta: { total: 0, totalPages: 0 },

  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  categoriesMeta: { total: 0, totalPages: 0 },

  tags: [],
  tagsLoading: false,
  tagsError: null,
  tagsMeta: { total: 0, totalPages: 0 },

  postTypes: [],
  postTypesLoading: false,
  postTypesError: null,

  // Actions
  fetchPages: async (params = {}) => {
    set({ pagesLoading: true, pagesError: null });
    try {
      const response = await contentApi.fetchPages(params);
      const pages = response.items || response;
      const total = response.total || 0;
      const totalPages = response.totalPages || 0;
      
      if (params.page > 1) {
        set(state => ({ 
          pages: [...state.pages, ...pages], 
          pagesLoading: false,
          pagesMeta: { total, totalPages }
        }));
      } else {
        set({ 
          pages, 
          pagesLoading: false,
          pagesMeta: { total, totalPages }
        });
      }
      return pages;
    } catch (error) {
      console.error('Error fetching pages:', error);
      set({ pagesLoading: false, pagesError: error });
      throw error;
    }
  },

  fetchCategories: async (params = {}) => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      const response = await contentApi.fetchCategories(params);
      const categories = response.items || response;
      const total = response.total || 0;
      const totalPages = response.totalPages || 0;
      
      if (params.page > 1) {
        set(state => ({ 
          categories: [...state.categories, ...categories], 
          categoriesLoading: false,
          categoriesMeta: { total, totalPages }
        }));
      } else {
        set({ 
          categories, 
          categoriesLoading: false,
          categoriesMeta: { total, totalPages }
        });
      }
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ categoriesLoading: false, categoriesError: error });
      throw error;
    }
  },

  fetchTags: async (params = {}) => {
    set({ tagsLoading: true, tagsError: null });
    try {
      const response = await contentApi.fetchTags(params);
      const tags = response.items || response;
      const total = response.total || 0;
      const totalPages = response.totalPages || 0;
      
      if (params.page > 1) {
        set(state => ({ 
          tags: [...state.tags, ...tags], 
          tagsLoading: false,
          tagsMeta: { total, totalPages }
        }));
      } else {
        set({ 
          tags, 
          tagsLoading: false,
          tagsMeta: { total, totalPages }
        });
      }
      return tags;
    } catch (error) {
      console.error('Error fetching tags:', error);
      set({ tagsLoading: false, tagsError: error });
      throw error;
    }
  },

  fetchPostTypes: async () => {
    set({ postTypesLoading: true, postTypesError: null });
    try {
      const postTypes = await contentApi.fetchPostTypes();
      set({ postTypes, postTypesLoading: false });
      return postTypes;
    } catch (error) {
      console.error('Error fetching post types:', error);
      set({ postTypesError: error, postTypesLoading: false });
      throw error;
    }
  },
}));

export default useContentStore;