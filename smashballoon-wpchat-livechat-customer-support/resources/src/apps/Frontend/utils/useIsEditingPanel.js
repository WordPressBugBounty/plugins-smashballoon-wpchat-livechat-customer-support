import { useChatStore } from '@Frontend/context/ChatStoreContext';

/**
 * Hook to check if a specific panel is being edited in the customizer.
 *
 * @param {string} panelSlug - The slug of the panel to check (e.g., 'frequentQuestions', 'sendMessage')
 * @returns {boolean} - True if currently editing the specified panel in customizer
 *
 * @example
 * const isEditingFaqPanel = useIsEditingPanel('frequentQuestions');
 * const isEditingSendMessage = useIsEditingPanel('sendMessage');
 */
export function useIsEditingPanel(panelSlug) {
  const isPreviewMode = useChatStore((s) => s.isPreviewMode);
  const route = useChatStore((s) => s.route);

  return isPreviewMode && route?.includes(`/panel/${panelSlug}`);
}
