import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import FrontendShadow from '@Frontend/Frontend';
import { chatSettingsInitializer, useChatStore } from '@FDataStore/Chat/chatStore';
import { ChatStoreProvider } from '@Frontend/context/ChatStoreContext';
import { cn } from '@Utils/cn';

/**
 * Renders the embedded frontend interface, typically used to display a simplified or
 * embedded version of the main UI. Accepts a custom class name for styling.
 * Used in Dashboard, Funnel preview, FAQ preview, Customizer, etc.
 *
 * @param {Object} props - The component props.
 * @param {string} props.className - Additional CSS class names for styling the component container.
 * @param {number} [props.fixedHeight] - Optional fixed height in pixels for the widget (disables dynamic height).
 * @param {boolean} [props.disableChatToggle] - Optional flag to disable chat toggle button.
 * @param {boolean} [props.showLoader] - Optional flag to show a loading overlay while initializing (used in Customizer).
 * @param {Function} [props.onReady] - Optional callback fired when the frontend has finished initializing and rendering.
 *
 * @returns {JSX.Element} The rendered EmbeddedFrontend component.
 */
export default function EmbeddedFrontend({className, fixedHeight, showLoader = false, onReady}) {
  const containerRef = useRef(null);
  const rootRef = useRef(null);
  const [isLoading, setIsLoading] = useState(showLoader);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // Initialize and render
    const init = async () => {
      try {
        await chatSettingsInitializer();

        // Check if still mounted after async operation
        if (isMounted && containerRef.current) {
          rootRef.current = createRoot(containerRef.current);
          rootRef.current.render(
            <ChatStoreProvider store={useChatStore}>
              <FrontendShadow fixedHeight={fixedHeight} />
            </ChatStoreProvider>
          );
          // Small delay to ensure the frontend has rendered before hiding loader and firing onReady
          setTimeout(() => {
            if (isMounted) {
              if (showLoader) {
                setIsLoading(false);
              }
              onReady?.();
            }
          }, 150);
        }
      } catch (error) {
        console.error('Failed to initialize EmbeddedFrontend:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    // Cleanup
    return () => {
      isMounted = false;

      // Unmount React root if it exists
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, []);

  return (
    <div className={cn('wpchat:relative', className)}>
      <div
        ref={containerRef}
        className={cn(
          showLoader && 'wpchat:transition-opacity wpchat:duration-200',
          showLoader && isLoading ? 'wpchat:opacity-0' : 'wpchat:opacity-100'
        )}
      />
    </div>
  );
}
