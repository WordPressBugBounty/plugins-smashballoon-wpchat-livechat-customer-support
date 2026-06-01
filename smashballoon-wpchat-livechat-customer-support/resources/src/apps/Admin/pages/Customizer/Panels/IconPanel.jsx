import React, { useEffect } from 'react';
import IconGrid from '@AC/Customizer/IconGrid';
import { useChatStore } from '@FDataStore/Chat/chatStore';

/**
 * IconPanel component displays a collection or grid of icons within a panel.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered IconPanel component.
 */
export default function IconPanel() {
  const setChatToggleIcon = useChatStore((s) => s.setChatToggleIcon);
  const setShowChat = useChatStore((s) => s.setShowChat);

  // Hide chat UI when entering this panel, show it when leaving
  useEffect(() => {
    setShowChat(false);
    return () => setShowChat(true);
  }, [setShowChat]);

  const icons = [
    { icon: 'chatBubbleLogo', isPro: false },
    { icon: 'chatBubble', isPro: true },
    { icon: 'chatBubbleDots', isPro: true },
    { icon: 'chatQuestionMark', isPro: true },
    { icon: 'ChatBubbleSmile', isPro: true },
    { icon: 'chatBubbleEyes', isPro: true },
  ];

  const handleIconClick = ({ icon }) => {
    setChatToggleIcon(icon);
    setShowChat(false);
  };

  return <IconGrid icons={icons} onIconClick={handleIconClick} slug="icon" />;
}
