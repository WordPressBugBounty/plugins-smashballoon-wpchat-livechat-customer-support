import { create } from 'zustand';
import { __ } from '@wordpress/i18n';

/**
 * Compute the ordered, visibility-filtered list of platform slugs to render.
 * Newly-available platforms not yet in the saved order are appended so they
 * appear on the frontend without needing a customizer save round-trip.
 */
export const computeActivePlatformSlugs = (platformOrder, platformVisibility, availablePlatforms) => {
  const available = availablePlatforms ?? [];
  const ordered = platformOrder ?? [];
  const merged = [...ordered, ...available.filter((s) => !ordered.includes(s))];
  return merged.filter(
    (slug) => available.includes(slug) && (platformVisibility?.[slug] !== false),
  );
};

// Define which keys should be persisted to database
// All other keys in initialState are runtime-only and won't be saved
export const persistableKeys = [
  'theme',
  'chatToggleIcon',
  'headerHeading',
  'sendMessageHeading',
  'sendMessageSubHeading',
  'faqHeading',
  'chatbotAvatar',
  'chatbotName',
  'chatbotCustomAvatar',
  'chatbotCustomName',
  'brandColor',
  'reorderableKeys',
  'visibleMap',
  'chatInputVariation',
  'sendMessageIcon',
  'iconType',
  'iconShape',
  'iconPosition',
  'iconPositionOffsetX',
  'iconPositionOffsetY',
  'iconAnimation',
  'platformOrder',
  'platformVisibility'
];

// Base initial state (without instance-specific fields)
const getInitialState = () => ({
  rootClassName: '',
  disableFixed: false,
  showChat: false,
  showChatInput: false,
  initialRoute: '/',
  showChatToggle: true,
  disableChatToggle: false,
  disableNavigation: false,
  disableFaqTracking: false,
  disableFunnelTracking: false,
  response: null,
  replaceMode: false,
  chatToggleIcon: 'chatBubbleLogo',
  chatInputSendIcon: 'send',
  headerHeading: __('How can we help you?', 'smashballoon-wpchat-livechat-customer-support'),
  headerHeadingClasses:
    'wpchat:max-w-[237px] wpchat:pt-5.5 wpchat:pb-7 wpchat:mx-auto wpchat:text-center',
  sendMessageIcon: true,
  sendMessageHeading: __('Send us a message', 'smashballoon-wpchat-livechat-customer-support'),
  sendMessageSubHeading: __(
    'on a platform of your choice',
    'smashballoon-wpchat-livechat-customer-support',
  ),
  faqHeading: __('Frequently Asked Questions', 'smashballoon-wpchat-livechat-customer-support'),
  brandColor: 22,
  theme: 'basic',
  searchBorder: true,
  reorderableKeys: ['sendMessage', 'frequentQuestions', 'wpChatBranding'],
  visibleMap: {
    sendMessage: true,
    frequentQuestions: true,
    wpChatBranding: true
  },
  chatInputVariation: 'primary',
  iconType: 'platform',
  iconShape: 'circle',
  iconPosition: 'right',
  iconPositionOffsetX: 0,
  iconPositionOffsetY: 0,
  iconAnimation: 'none',
  frontendClassName: '',
  chatbotAvatar: 'juno',
  chatbotName: 'WPChat',
  chatbotCustomAvatar: '',
  chatbotCustomName: '',
  wpChatBranding: 'brandingLogo',
  route: '',
  chatMessages: [],
  chatFunnelId: '',
  chatFunnelLastBlockOrder: 1,
  funnelContext: null,
  isPreviewMode: false,
  reorder: false,
  availablePlatforms: null,
  offHoursData: null,
  platformsLoading: true,
  widgetHeight: null,
  isRTL: false,
  platformOrder: null,
  platformVisibility: null,
});

/**
 * Creates a new isolated Zustand store instance for chat functionality.
 * Each instance has independent state and can be used for floating button,
 * shortcode widgets, or admin preview.
 *
 * @param {string} instanceId - Unique identifier for this store instance
 * @param {string} instanceType - Type of instance: 'floating', 'shortcode', or 'preview'
 * @returns {Function} Zustand store hook for this instance
 */
export function createChatStore(instanceId, instanceType) {
  return create((set, get) => ({
    ...getInitialState(),
    // Instance-specific fields
    instanceId,
    instanceType,

    hydrateFromSettings: (settings) => {
      set((state) => ({
        ...state,
        ...Object.fromEntries(
          Object.entries(settings).filter(
            ([key, value]) => value !== undefined && persistableKeys.includes(key),
          ),
        ),
      }));
    },
    setRootClassName: (rootClassName) => set({ rootClassName }),
    setDisableFixed: (flag) => set({ disableFixed: flag }),
    setShowChat: (flag) => set({ showChat: flag }),
    setShowChatInput: (flag) => set({ showChatInput: flag }),
    setInitialRoute: (value) => set({ initialRoute: value }),
    setShowChatToggle: (flag) => set({ showChatToggle: flag }),
    setDisableChatToggle: (flag) => set({ disableChatToggle: flag }),
    setDisableNavigation: (flag) => set({ disableNavigation: flag }),
    setChatMessages: (updater) =>
      set((state) => ({
        chatMessages: typeof updater === 'function' ? updater(state.chatMessages) : updater,
      })),
    setReplaceMode: (flag) => set({ replaceMode: flag }),
    setHeaderHeading: (value) => set({ headerHeading: value }),
    setRoute: (value) => set({ route: value }),
    setHeaderHeadingClasses: (value) => set({ headerHeadingClasses: value }),
    setSendMessageIcon: (flag) => set({ sendMessageIcon: flag }),
    setSendMessageHeading: (value) => set({ sendMessageHeading: value }),
    setSendMessageSubHeading: (value) => set({ sendMessageSubHeading: value }),
    setFaqHeading: (value) => set({ faqHeading: value }),
    setFunnelContext: (context) => set({ funnelContext: context }),
    clearFunnelContext: () => set({ funnelContext: null }),
    setChatToggleIcon: (value) => set({ chatToggleIcon: value }),
    setBrandColor: (value) => set({ brandColor: value }),
    setTheme: (value) => set({ theme: value }),
    setChatInputVariation: (value) => set({ chatInputVariation: value }),
    setChatInputSendIcon: (value) => set({ chatInputSendIcon: value }),
    setIconType: (value) => set({ iconType: value }),
    setIconShape: (value) => set({ iconShape: value }),
    setIconPosition: (value) => set({ iconPosition: value }),
    setIconPositionOffsetX: (value) => set({ iconPositionOffsetX: value }),
    setIconPositionOffsetY: (value) => set({ iconPositionOffsetY: value }),
    setIconAnimation: (value) => set({ iconAnimation: value }),
    setSearchBorder: (flag) => set({ searchBorder: flag }),
    setReorderableKeys: (keys) => set({ reorderableKeys: keys }),
    setVisibleMap: (map) => set({ visibleMap: map }),
    setDisableFaqTracking: (flag) => set({ disableFaqTracking: flag }),
    setDisableFunnelTracking: (flag) => set({ disableFunnelTracking: flag }),
    setChatbotAvatar: (value) => set({ chatbotAvatar: value }),
    setChatbotCustomAvatar: (value) => set({ chatbotCustomAvatar: value }),
    setChatbotName: (value) => set({ chatbotName: value }),
    setChatbotCustomName: (value) => set({ chatbotCustomName: value }),
    setWpChatBranding: (value) => set({ wpChatBranding: value }),
    toggleVisibleKey: (key) =>
      set((state) => ({
        visibleMap: {
          ...state.visibleMap,
          [key]: !state.visibleMap[key],
        },
      })),
    setNavigateTo: (fn) => set({ navigateTo: fn }),
    navigateViaStore: (route, state = {}) => {
      const navFn = get().navigateTo;
      if (navFn) {
        navFn(route, state);
        set({ route });
      }
    },
    setFrontendClassName: (className) => set({ frontendClassName: className }),
    setChatFunnelId: (value) => set({ chatFunnelId: value }),
    setChatFunnelLastBlockOrder: (value) => set({ chatFunnelLastBlockOrder: value }),
    setIsPreviewMode: (flag) => set({ isPreviewMode: flag }),
    setReorder: (flag) => set({ reorder: flag }),
    setAvailablePlatforms: (platforms) => set({ availablePlatforms: platforms }),
    setOffHoursData: (data) => set({ offHoursData: data }),
    setPlatformsLoading: (loading) => set({ platformsLoading: loading }),
    setOffHoursData: (data) => set({ offHoursData: data }),
    setWidgetHeight: (height) => set({ widgetHeight: height }),
    setIsRTL: (flag) => set({ isRTL: flag }),
    setPlatformOrder: (value) => set({ platformOrder: value }),
    setPlatformVisibility: (value) => set({ platformVisibility: value }),
    togglePlatformVisibility: (slug) => set((state) => ({
      platformVisibility: { ...state.platformVisibility, [slug]: !state.platformVisibility?.[slug] },
    })),
    getActivePlatformSlugs: () => {
      const { platformOrder, platformVisibility, availablePlatforms } = get();
      return computeActivePlatformSlugs(platformOrder, platformVisibility, availablePlatforms);
    },

    /**
     * Fetch and set available platforms.
     * In preview mode: Returns all enabled platforms from settings (for admin testing)
     * In frontend mode: Fetches from API (filtered by agent availability)
     */
    fetchAvailablePlatforms: async () => {
      const state = get();

      // Only fetch if not already fetched
      if (state.availablePlatforms !== null) {
        set({ platformsLoading: false });
        return state.availablePlatforms;
      }

      set({ platformsLoading: true });

      try {
        // Always fetch from API to get platforms with actual agent availability
        const { getAvailablePlatforms } = await import('@FDataStore/Chat/chatApi');
        const { platforms, offHoursData } = await getAvailablePlatforms();

        set({ availablePlatforms: platforms, offHoursData, platformsLoading: false });
        return platforms;
      } catch (error) {
        console.error('Failed to fetch available platforms:', error);

        // Fall back to showing platforms from settings
        const useSettingsStore = (await import('@DataStore/settings/settingsStore')).default;
        const settings = useSettingsStore.getState().settings;
        const enabledPlatforms = settings?.agentSettings?.platforms || {};
        const fallbackPlatforms = Object.keys(enabledPlatforms).filter(p => enabledPlatforms[p]?.enabled);
        const platforms = fallbackPlatforms.length > 0 ? fallbackPlatforms : ['whatsapp'];

        set({ availablePlatforms: platforms, offHoursData: null, platformsLoading: false });
        return platforms;
      }
    },

    reset: () => set((state) => {
      // Preserve persistable settings and instance metadata when resetting
      const persistedSettings = {};
      persistableKeys.forEach(key => {
        if (state[key] !== undefined) {
          persistedSettings[key] = state[key];
        }
      });

      // Reset to initial state but keep persisted settings and instance info
      return {
        ...getInitialState(),
        ...persistedSettings,
        instanceId: state.instanceId,
        instanceType: state.instanceType,
      };
    }),
  }));
}
