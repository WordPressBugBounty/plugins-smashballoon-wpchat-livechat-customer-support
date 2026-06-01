import { __ } from '@wordpress/i18n';
import { getPlatformLink } from '@FDataStore/Chat/chatApi';
import { createChatMessage } from '@FU/createChatMessage';
import { getPlatformNameBySlug } from '@Utils/getPlatformNameBySlug';
import { logFunnelComplete } from '@FDataStore/Chat/analyticsApi';

/**
 * Returns the initial chatbot message with internal logic and store updates.
 * Everything is self-contained in this function.
 *
 * @param {(msg: object) => void} navigateToErrorPage
 * @param {(url: string) => void} openLink
 * @param {Array<string>} availablePlatforms - Array of platform slugs (strings), e.g. ['whatsapp', 'telegram', 'messenger', 'instagram']. Each slug should correspond to a supported platform.
 * @param {Function} storeApi - The Zustand store instance for this chat widget
 * @returns {object} botMsg
 */
export function getInitialMessages(navigateToErrorPage, openLink, availablePlatforms = null, storeApi = null) {
  const errorMessage = __(
    'Sorry, no agents are available at the moment. Please try again later.',
    'smashballoon-wpchat-livechat-customer-support',
  );

  // Fallback to no-ops when storeApi is not provided (e.g. AssistantAvatarPanel renders
  // a static preview in the admin customizer and doesn't need a real store).
  const { setChatMessages, funnelContext, clearFunnelContext } = storeApi
    ? storeApi.getState()
    : { setChatMessages: () => {}, funnelContext: null, clearFunnelContext: () => {} };

  const handlePlatformClick = async (platform) => {
    try {
      // Log funnel completion if we came from a funnel
      if (funnelContext) {
        const { funnelId, funnelName, completionBlock, blockMessage } = funnelContext;

        logFunnelComplete(funnelId, funnelName || '', completionBlock, 'converted', {
          completion_block: completionBlock,
          block_message: blockMessage,
          selected_platform: platform,
        });

        // Small delay to ensure analytics are sent before potential redirect
        await new Promise(resolve => setTimeout(resolve, 50));

        // Clear the funnel context after logging
        clearFunnelContext();
      }

      const agentData = await getPlatformLink(
        platform,
        '', // Empty chat message
        '', // Empty file attachment
        funnelContext ? 'funnel' : 'chat', // Pass source to backend
        funnelContext?.funnelId || null // Pass funnel_id if from funnel
      );

      // Store data for redirect message (can be serialized to localStorage)
      // Note: User choice message is already added by ChatBubble.handleClick
      const redirectMsg = {
        type: 'redirect',
        messageType: 'receive',
        data: {
          name: agentData.name,
          phone_number: agentData.phone_number,
          platformName: getPlatformNameBySlug(platform),
          avatar: agentData.avatar,
        },
      };
      setChatMessages((prev) => [...prev, redirectMsg]);

      setTimeout(() => {
        if (agentData?.link) {
          openLink(agentData.link);

          // Store data for fallback message (can be serialized to localStorage)
          const fallbackMsg = {
            type: 'fallback_link',
            messageType: 'receive',
            data: {
              platformName: getPlatformNameBySlug(platform),
              link: agentData.link,
            },
          };
          setChatMessages((prev) => [...prev, fallbackMsg]);
        } else {
          navigateToErrorPage(errorMessage);
        }
      }, 3000);
    } catch (error) {
      navigateToErrorPage(error);
    }
  };

  // Use the dynamic available platforms list passed from parent
  // If no platforms available, show empty options
  const platformsToShow = availablePlatforms || [];

  // Map platform slugs to display options with proper labels
  // Filter out any invalid platforms to be safe
  const platformOptions = platformsToShow
    .filter(platformSlug => platformSlug && typeof platformSlug === 'string')
    .map(platformSlug => ({
      label: getPlatformNameBySlug(platformSlug),
      onClick: () => handlePlatformClick(platformSlug),
    }));

  return createChatMessage(
    __('Which platform would you like to talk on?', 'smashballoon-wpchat-livechat-customer-support'),
    platformOptions,
    'receive',
    true,
  );
}
