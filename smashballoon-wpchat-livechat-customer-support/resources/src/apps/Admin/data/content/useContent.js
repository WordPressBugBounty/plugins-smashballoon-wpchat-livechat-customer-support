import { useEffect, useCallback } from 'react';
import useContentStore from './contentStore';
import { formatPages, formatCategories, formatTags, formatPostTypes } from './formatters';
import debounce from 'lodash.debounce';

// Cache for post types
let postTypesCache = null;

/**
 * Custom hook for fetching and accessing pages with debounced API calls
 * 
 * @param {Object} params Search and filter parameters
 * @param {Object} options Hook options
 * @param {number} options.debounceTime Time in ms to debounce the API call
 * @param {boolean} options.formatted Whether to return formatted data (default: true)
 * @returns {Object} Pages data, loading state, and error
 */
export const usePages = (params = {}, options = { debounceTime: 300, formatted: true }) => {
  const { pages, pagesLoading, pagesError, pagesMeta, fetchPages } = useContentStore();

  // Create a stable reference to the fetch function
  const debouncedFetch = useCallback(
    debounce(async (searchParams) => {
      const hasSearchTerm = searchParams && searchParams.search !== null && searchParams.search !== undefined && searchParams.search.trim() !== '';
      if (hasSearchTerm) {
        await fetchPages(searchParams);
      }
    }, options.debounceTime),
    [fetchPages]
  );

  useEffect(() => {
    // Only fetch when params change, using debounce for all calls
    debouncedFetch(params);
    return () => {
      if (debouncedFetch.cancel) {
        debouncedFetch.cancel();
      }
    }
  }, [JSON.stringify(params), debouncedFetch]);

  return {
    pages: options.formatted ? formatPages(pages) : pages,
    rawPages: pages,
    loading: pagesLoading,
    error: pagesError,
    meta: pagesMeta
  };
};

/**
 * Custom hook for fetching and accessing categories with debounced API calls
 * 
 * @param {Object} params Search and filter parameters
 * @param {Object} options Hook options
 * @param {number} options.debounceTime Time in ms to debounce the API call
 * @param {boolean} options.formatted Whether to return formatted data (default: true)
 * @returns {Object} Categories data, loading state, and error
 */
export const useCategories = (params = {}, options = { debounceTime: 300, formatted: true }) => {
  const { categories, categoriesLoading, categoriesError, categoriesMeta, fetchCategories } = useContentStore();

  // Create a stable reference to the fetch function
  const debouncedFetch = useCallback(
    debounce(async (searchParams) => {
      const hasSearchTerm = searchParams && searchParams.search !== null && searchParams.search !== undefined && searchParams.search.trim() !== '';
      if (hasSearchTerm) {
        await fetchCategories(searchParams);
      }
    }, options.debounceTime),
    [fetchCategories]
  );

  useEffect(() => {
    // Only fetch when params change, using debounce for all calls
    debouncedFetch(params);
    return () => {
      if (debouncedFetch.cancel) {
        debouncedFetch.cancel();
      }
    }
  }, [JSON.stringify(params), debouncedFetch]);

  return {
    categories: options.formatted ? formatCategories(categories) : categories,
    rawCategories: categories,
    loading: categoriesLoading,
    error: categoriesError,
    meta: categoriesMeta
  };
};

/**
 * Custom hook for fetching and accessing tags with debounced API calls
 * 
 * @param {Object} params Search and filter parameters
 * @param {Object} options Hook options
 * @param {number} options.debounceTime Time in ms to debounce the API call
 * @param {boolean} options.formatted Whether to return formatted data (default: true)
 * @returns {Object} Tags data, loading state, and error
 */
export const useTags = (params = {}, options = { debounceTime: 300, formatted: true }) => {
  const { tags, tagsLoading, tagsError, tagsMeta, fetchTags } = useContentStore();

  // Create a stable reference to the fetch function
  const debouncedFetch = useCallback(
    debounce(async (searchParams) => {
      const hasSearchTerm = searchParams && searchParams.search !== null && searchParams.search !== undefined && searchParams.search.trim() !== '';
      if (hasSearchTerm) {
        await fetchTags(searchParams);
      }
    }, options.debounceTime),
    [fetchTags]
  );

  useEffect(() => {
    // Only fetch when params change, using debounce for all calls
    debouncedFetch(params);
    return () => {
      if (debouncedFetch.cancel) {
        debouncedFetch.cancel();
      }
    }
  }, [JSON.stringify(params), debouncedFetch]);

  return {
    tags: options.formatted ? formatTags(tags) : tags,
    rawTags: tags,
    loading: tagsLoading,
    error: tagsError,
    meta: tagsMeta
  };
};

/**
 * Custom hook for fetching and accessing available post types
 * Post types don't typically change often so we cache them
 * 
 * @param {Object} options Hook options
 * @param {boolean} options.formatted Whether to return formatted data (default: true)
 * @returns {Object} Post types data, loading state, and error
 */
export const usePostTypes = (options = { formatted: true }) => {
  const { postTypes, postTypesLoading, postTypesError, fetchPostTypes } = useContentStore();

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (!postTypesCache) {
      fetchPostTypes().then((data) => {
        postTypesCache = data;
      });
    }
  }, [fetchPostTypes]);

  return {
    postTypes: options.formatted ? formatPostTypes(postTypesCache || postTypes) : (postTypesCache || postTypes),
    rawPostTypes: postTypesCache || postTypes,
    loading: postTypesLoading,
    error: postTypesError
  };
};