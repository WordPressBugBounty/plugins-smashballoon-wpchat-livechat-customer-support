import { wpChatAPI } from '@Utils/apiHelper';

export const fetchAgents = async () => {
  return await wpChatAPI.get('agents');
};

export const createAgent = async (agentData) => {
  const response = await wpChatAPI.post('agents', agentData);
  if (response && response.status === 201) {
    return response.id; // Return the created agent ID
  }
  return false;
};

export const updateAgent = async (id, agentData) => {
  const response = await wpChatAPI.put(`agents/${id}`, agentData);
  return response && response.status === 200;
};

export const deleteAgent = async (id) => {
  const response = await wpChatAPI.delete(`agents/${id}`);
  return response && response.status === 200;
};

export const fetchAgent = async (id) => {
  return await wpChatAPI.get(`agents/${id}`);
};
