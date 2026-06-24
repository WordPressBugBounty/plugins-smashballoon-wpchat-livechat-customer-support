import { wpChatAPI } from '@Utils/apiHelper';

export const fetchNotifications = async () => {
  const response = await wpChatAPI.get('notifications');
  return response;
};

export const dismissNotification = async (id) => {
  const response = await wpChatAPI.post('notifications/dismiss', { id: String(id) });
  return response;
};
