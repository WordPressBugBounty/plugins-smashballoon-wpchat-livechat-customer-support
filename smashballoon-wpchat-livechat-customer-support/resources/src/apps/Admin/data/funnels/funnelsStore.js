import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { __ } from '@wordpress/i18n';
import {
  bulkDeleteFunnels,
  cloneFunnel,
  createFunnel,
  deleteFunnel,
  fetchFunnel,
  fetchFunnels,
  rebuildFunnelsVisibilityMap,
  updateFunnel,
  updateVisibilityMap,
  fetchFunnelAnalytics,
  fetchFunnelAnalyticsSummary
} from './funnelsApi';

/**
 * Creates a new dummy block with fresh UUIDs for options.
 * @returns {Object} Dummy block
 */
const createDummyBlock = () => ({
  funnel_id: null,
  block_order: '1',
  message: 'This is a dummy message block',
  image: '',
  options: [
    {
      id: uuidv4(),
      label: 'First Option',
      block_order: 1,
      block: { type: 'support', block: null },
    },
    {
      id: uuidv4(),
      label: 'Second Option',
      block_order: 2,
      block: { type: 'support', block: null },
    },
  ],
});

/** Initial funnel state */
const initialFunnel = {
  id: null,
  name: 'My Funnel',
  visibility: {
    pages: [],
    categories: [],
    tags: [],
    postTypes: [],
  },
  blocks: [createDummyBlock()],
};

export const useFunnelsStore = create((set, get) => ({
  /** @type {Array} List of all funnels */
  funnels: [],

  /** @type {Object} Current funnel with blocks and visibility */
  funnel: initialFunnel,

  /** @type {boolean} Loading state */
  loading: false,

  /** @type {string|null} Error message */
  error: null,

  /** @type {Object} Pagination info */
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalFunnels: 0,
  },

  /** @type {Object} Cache for paginated funnels */
  pageCache: {},

  /**
   * Merge funnel state with new data
   * @param {Object} funnelData
   */
  setFunnel: (funnelData) => set({ funnel: { ...(get().funnel || {}), ...funnelData } }),

  /**
   * Load a single funnel by ID
   * @param {number|string} id
   * @returns {Promise<Object>} Funnel data
   */
  loadFunnel: async (id) => {
    const existingFunnel = get().funnels.find((f) => f.id === id);
    if (existingFunnel) {
      set({ funnel: existingFunnel });
      return existingFunnel;
    }

    set({ loading: true, error: null });
    try {
      const funnel = await fetchFunnel(id);
      set((state) => ({
        funnels: [...state.funnels.filter((f) => f.id !== funnel.id), funnel],
        funnel,
      }));
      return funnel;
    } catch (error) {
      set({
        error: __('[WPC-FUN-009] Error fetching funnel', 'smashballoon-wpchat-livechat-customer-support'),
        loading: false,
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Load funnels for a specific page with caching
   * @param {number} page
   * @returns {Promise<Array>} Funnels list
   */
  loadFunnels: async (page = 1) => {
    // Prevent duplicate requests while one is already in progress
    if (get().loading) {
      return get().funnels;
    }

    try {
      const validPage = parseInt(page) || 1;

      // Check if we have cached data for this page
      const cachedData = get().pageCache[validPage];
      if (cachedData) {
        set({ funnels: cachedData.funnels, pagination: cachedData.pagination });
        return cachedData.funnels;
      }

      set({ loading: true, error: null });
      const response = await fetchFunnels(validPage);
      const pageData = {
        funnels: response.funnels || [],
        pagination: {
          currentPage: response.current_page || validPage,
          totalPages: response.total_pages || 1,
          totalFunnels: response.total_funnels || 0,
        },
      };

      set({
        funnels: pageData.funnels,
        loading: false,
        pagination: pageData.pagination,
        pageCache: { ...get().pageCache, [validPage]: pageData },
      });

      return pageData.funnels;
    } catch (error) {
      console.error('Error in loadFunnels:', error);
      set({
        error: __('[WPC-FUN-010] Error fetching funnels', 'smashballoon-wpchat-livechat-customer-support'),
        loading: false,
        funnels: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalFunnels: 0,
        },
      });
      return [];
    }
  },

  /** Clear funnel cache */
  clearCache: () => set({ pageCache: {}, funnels: [] }),

  /**
   * Add a new funnel
   * @param {Object} funnelData
   * @returns {Promise<Object>} Created funnel
   */
  addFunnel: async (funnelData) => {
    try {
      set({ error: null });
      const result = await createFunnel(funnelData);
      if (result) {
        get().clearCache();
        await get().loadFunnels();
      }
      return result;
    } catch (error) {
      console.error('Error in addFunnel:', error);
      set({ error: __('[WPC-FUN-002] Error creating funnel', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  /**
   * Edit an existing funnel
   * @param {number|string} id
   * @param {Object} funnelData
   * @returns {Promise<boolean>}
   */
  editFunnel: async (id, funnelData) => {
    try {
      set({ error: null });
      const existingFunnel = get().funnels.find((f) => f.id === id) || {};
      const updatedData = { ...existingFunnel, ...funnelData };
      const result = await updateFunnel(id, updatedData);
      if (result) {
        get().clearCache();
        await get().loadFunnels();
      }
      return result;
    } catch (error) {
      console.error('Error in editFunnel:', error);
      set({ error: __('[WPC-FUN-003] Error updating funnel', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  /**
   * Delete a funnel by ID
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  removeFunnel: async (id) => {
    try {
      set({ error: null });
      const result = await deleteFunnel(id);
      if (result) {
        get().clearCache();
        await get().loadFunnels();
      }
      return result;
    } catch (error) {
      console.error('Error in removeFunnel:', error);
      set({ error: __('[WPC-FUN-004] Error deleting funnel', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  /**
   * Clone a funnel by ID
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  cloneFunnel: async (id) => {
    try {
      set({ error: null });
      const result = await cloneFunnel(id);
      if (result) {
        get().clearCache();
        const currentPage = get().pagination.currentPage;
        await get().loadFunnels(currentPage);
      }
      return result;
    } catch (error) {
      console.error('Error in cloneFunnel:', error);
      set({ error: __('[WPC-FUN-005] Error cloning funnel', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  /**
   * Bulk delete funnels by IDs
   * @param {Array<number|string>} ids
   * @returns {Promise<boolean>}
   */
  removeFunnels: async (ids) => {
    try {
      set({ error: null });
      const result = await bulkDeleteFunnels(ids);
      if (result) {
        get().clearCache();
        await get().loadFunnels();
      }
      return result;
    } catch (error) {
      console.error('Error in removeFunnels:', error);
      set({ error: __('[WPC-FUN-004] Error deleting funnels', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  /**
   * Update a block by ID
   * @param {string|number} blockId
   * @param {Object} changes
   */
  updateBlock: (blockId, changes) => {
    const funnel = get().funnel;
    if (!funnel?.blocks) return;
    const updated = [...funnel.blocks];
    const index = updated.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    updated[index] = { ...updated[index], ...changes };
    set({ funnel: { ...funnel, blocks: updated } });
  },

  /**
   * Remove a block by ID or block_order and fix option references
   * @param {string|number} blockIdOrOrder
   */
  removeBlock: (blockIdOrOrder) => {
    const funnel = get().funnel;
    if (!funnel?.blocks?.length) return;

    const targetBlock =
      funnel.blocks.find((b) => String(b.id) === String(blockIdOrOrder)) ||
      funnel.blocks.find((b) => parseInt(b.block_order, 10) === parseInt(blockIdOrOrder, 10));
    if (!targetBlock) return;

    const targetOrder = parseInt(targetBlock.block_order, 10);

    // detect connections
    let hasConnections = false;
    outer: for (const b of funnel.blocks) {
      for (const opt of b.options || []) {
        if (opt?.block?.type === 'block') {
          const ref = parseInt(opt.block.block, 10);
          if (!Number.isNaN(ref) && ref === targetOrder) {
            hasConnections = true;
            break outer;
          }
        }
      }
    }

    if (
      hasConnections &&
      !window.confirm(
        __(
          'This block is connected to one or more options. If deleted, those options will be reset to Support. Do you want to continue?',
          'smashballoon-wpchat-livechat-customer-support',
        ),
      )
    )
      return;

    let updatedBlocks = funnel.blocks.filter((b) => String(b.id) !== String(targetBlock.id));

    // fix option references
    updatedBlocks = updatedBlocks.map((b) => ({
      ...b,
      options: (b.options || []).map((opt) => {
        if (opt?.block?.type !== 'block') return opt;
        const ref = parseInt(opt.block.block, 10);
        if (Number.isNaN(ref)) return opt;
        if (ref === targetOrder) return { ...opt, block: { type: 'support', block: null } };
        if (ref > targetOrder) return { ...opt, block: { ...opt.block, block: ref - 1 } };
        return opt;
      }),
    }));

    // resequence block_order
    updatedBlocks = updatedBlocks.map((b, i) => ({ ...b, block_order: String(i + 1) }));

    set({ funnel: { ...funnel, blocks: updatedBlocks } });
  },

  /**
   * Reorder funnel blocks and update option references
   * @param {Array<Object>} newOrder
   */
  reorderBlocks: (newOrder) => {
    const funnel = get().funnel;
    if (!funnel?.blocks) return;

    const orderMap = {};
    newOrder.forEach((block, i) => {
      orderMap[block.id] = i + 1;
    });

    const reordered = newOrder.map((block, i) => {
      const updatedOptions = (block.options || []).map((opt) => {
        if (opt.block?.type === 'block' && opt.block.block != null) {
          const targetBlock = funnel.blocks.find(
            (b) => parseInt(b.block_order) === opt.block.block,
          );
          if (targetBlock) {
            return { ...opt, block: { ...opt.block, block: orderMap[targetBlock.id] } };
          }
        }
        return opt;
      });
      return { ...block, block_order: i + 1, options: updatedOptions };
    });

    set({ funnel: { ...funnel, blocks: reordered } });
  },

  /** Add an option to a block */
  addOption: (blockId, option) => {
    set((state) => ({
      funnel: {
        ...state.funnel,
        blocks: state.funnel.blocks.map((block) =>
          block.id !== blockId ? block : { ...block, options: [...(block.options || []), option] },
        ),
      },
    }));
  },

  /** Remove an option from a block */
  removeOption: (blockId, optionId) => {
    set((state) => ({
      funnel: {
        ...state.funnel,
        blocks: state.funnel.blocks.map((block) =>
          block.id !== blockId
            ? block
            : { ...block, options: (block.options || []).filter((opt) => opt.id !== optionId) },
        ),
      },
    }));
  },

  /** Reorder options in a block */
  reorderOptions: (blockId, newOptions) => {
    set((state) => ({
      funnel: {
        ...state.funnel,
        blocks: state.funnel.blocks.map((block) =>
          block.id !== blockId ? block : { ...block, options: newOptions },
        ),
      },
    }));
  },

  /** Update a specific option in a block */
  updateOption: (blockId, optionId, changes) => {
    const funnel = get().funnel;
    const updatedBlocks = (funnel?.blocks || []).map((block) => {
      if (block.id !== blockId) return block;
      const updatedOptions = (block.options || []).map((opt) =>
        opt.id === optionId ? { ...opt, ...changes } : opt,
      );
      return { ...block, options: updatedOptions };
    });
    set({ funnel: { ...funnel, blocks: updatedBlocks } });
  },

  /** Rebuild visibility map for all funnels */
  rebuildFunnelsVisibilityMap: async () => {
    try {
      const success = await rebuildFunnelsVisibilityMap();
      if (!success) throw new Error('Failed to rebuild visibility map');
      return success;
    } catch (error) {
      console.error('Error rebuilding funnels visibility map:', error);
      set({
        error: __('Failed to rebuild visibility map', 'smashballoon-wpchat-livechat-customer-support'),
      });
      throw error;
    }
  },

  /** Update visibility for a specific funnel */
  updateFunnelsVisibilityMap: async (funnelId, visibility) => {
    try {
      const result = await updateVisibilityMap(funnelId, visibility);
      return result;
    } catch (error) {
      console.error('Error updating visibility map for funnel:', error);
      set({
        error: __(
          'Failed to update visibility map for funnel',
          'smashballoon-wpchat-livechat-customer-support',
        ),
      });
      throw error;
    }
  },

  /** Reset current funnel to initial state with a fresh dummy block */
  resetFunnelWithDummyBlock: () => {
    set({ funnel: { ...initialFunnel, blocks: [createDummyBlock()] } });
  },

  /**
   * Fetch analytics data for a specific funnel
   * @param {number|string} funnelId
   * @param {string} timeRange
   * @returns {Promise<Object>} Individual funnel analytics data
   */
  fetchFunnelAnalytics: async (funnelId, timeRange = 'this_month') => {
    try {
      set({ error: null });
      const result = await fetchFunnelAnalytics(funnelId, timeRange);
      return result;
    } catch (error) {
      console.error('Error fetching funnel analytics:', error);
      set({ error: __('Error fetching funnel analytics', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  /**
   * Fetch comprehensive funnel analytics summary for Analytics Section
   * @param {string} timeRange
   * @returns {Promise<Object>} Funnel analytics summary data
   */
  fetchFunnelAnalyticsSummary: async (timeRange = 'this_month') => {
    try {
      set({ error: null });
      const result = await fetchFunnelAnalyticsSummary(timeRange);
      return result;
    } catch (error) {
      console.error('Error fetching funnel analytics summary:', error);
      set({ error: __('Error fetching funnel analytics summary', 'smashballoon-wpchat-livechat-customer-support') });
      throw error;
    }
  },

  // Reset loading state - useful for cleanup
  resetLoading: () => {
    set({ loading: false, error: null });
  },

  // Reset store to initial state
  resetStore: () => {
    set({
      funnels: [],
      loading: false,
      error: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalFunnels: 0
      },
      pageCache: {},
    });
  },
}));

export default useFunnelsStore;
