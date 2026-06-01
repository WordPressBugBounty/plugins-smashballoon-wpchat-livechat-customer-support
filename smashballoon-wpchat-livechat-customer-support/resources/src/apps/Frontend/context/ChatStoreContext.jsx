import React, { createContext, useContext } from 'react';
import { useStore } from 'zustand';

/**
 * React Context for providing isolated Zustand chat stores to component trees.
 * This enables multiple chat widget instances to have independent state.
 */
const ChatStoreContext = createContext(null);

/**
 * Provider component that wraps a widget tree with an isolated chat store.
 *
 * @param {Object} props
 * @param {Function} props.store - The Zustand store instance created by createChatStore
 * @param {React.ReactNode} props.children - Child components that will have access to the store
 */
export function ChatStoreProvider({ store, children }) {
  return (
    <ChatStoreContext.Provider value={store}>
      {children}
    </ChatStoreContext.Provider>
  );
}

/**
 * Hook to access the chat store from context.
 * Components should use this instead of importing directly from chatStore.
 *
 * @param {Function} [selector] - Optional selector function to extract specific state
 * @returns {*} The selected state or the entire state if no selector is provided
 *
 * @example
 * // Get specific state value
 * const showChat = useChatStore((s) => s.showChat);
 *
 * @example
 * // Get multiple values
 * const { showChat, theme } = useChatStore((s) => ({ showChat: s.showChat, theme: s.theme }));
 *
 * @example
 * // Get entire store (not recommended for performance)
 * const store = useChatStore();
 */
export function useChatStore(selector) {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error('useChatStore must be used within a ChatStoreProvider');
  }
  return useStore(store, selector);
}

/**
 * Hook to get the raw store reference for imperative operations.
 * Use this when you need to call getState() or subscribe() directly.
 *
 * @returns {Function} The raw Zustand store
 *
 * @example
 * const store = useChatStoreApi();
 * const currentState = store.getState();
 * store.getState().setChatMessages([...]);
 */
export function useChatStoreApi() {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error('useChatStoreApi must be used within a ChatStoreProvider');
  }
  return store;
}
