import { useChatStore } from '../Chat/chatStore';

/**
 * Apply theme presets to a store instance.
 * @param {string} theme - Theme name ('basic', 'night', 'pastel')
 * @param {Function} [store] - Optional Zustand store instance. Defaults to useChatStore.
 */
export default function themePresets(theme, store = useChatStore) {
  if (!theme) return false;

  const state = store.getState();

  const themes = {
    basic: () => {
      state.setSearchBorder(true);
      state.setBrandColor(22);
      state.setSendMessageIcon(true);
      state.setChatInputVariation('primary');
      state.setChatInputSendIcon('send');
      state.setChatToggleIcon('chatBubbleLogo');
      state.setHeaderHeadingClasses(
        'wpchat:mx-auto wpchat:max-w-[237px] wpchat:pt-5.5 wpchat:pb-7 wpchat:text-center',
      );
      state.setWpChatBranding('brandingLogo');
    },
    night: () => {
      state.setHeaderHeadingClasses('wpchat:mx-5.5 wpchat:mt-5.5 wpchat:mb-10.5 wpchat:max-w-[237px]');
      state.setSearchBorder(false);
      state.setBrandColor(22);
      state.setSendMessageIcon(false);
      state.setChatInputSendIcon('sendFillCircle');
      state.setChatInputVariation('secondary');
      state.setChatToggleIcon('chatBubbleLogo');
      state.setWpChatBranding('brandingLogoAlt');
    },
    pastel: () => {
      state.setBrandColor(22);
      state.setSearchBorder(false);
      state.setSendMessageIcon(false);
      state.setChatInputSendIcon('sendFill');
      state.setChatInputVariation('tertiary');
      state.setChatToggleIcon('chatBubbleLogo');
      state.setHeaderHeadingClasses(
        'wpchat:mx-auto wpchat:max-w-[237px] wpchat:pt-10.5 wpchat:pb-13.5 wpchat:text-center',
      );
      state.setWpChatBranding('brandingLogo');
    },
  };

  if (themes[theme]) {
    themes[theme]();
    return true;
  }

  return false;
}
