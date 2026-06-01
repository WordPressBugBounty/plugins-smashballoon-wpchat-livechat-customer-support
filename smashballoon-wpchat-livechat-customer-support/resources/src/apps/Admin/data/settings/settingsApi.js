import { wpChatAPI } from '@Utils/apiHelper';

export const fetchSettings = async () => {
  try {
    const nonce = window.wpChatFrontend?.frontendNonce || window.wpChatAdmin?.restNonce || '';
    const context = window.wpChatFrontend ? 'frontend' : 'admin';
    
    const response = await wpChatAPI.get('settings', { nonce }, context);
    return response || {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

export const saveSettings = async (updatedData) => {
  try {
    const response = await wpChatAPI.post('settings', updatedData);
    return response;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};
