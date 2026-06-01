import { create } from 'zustand';
import { createAgent, deleteAgent, fetchAgent, fetchAgents, updateAgent } from './agentsApi';

const useAgentsStore = create((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  areAgentsLoaded: false,

  loadAgents: async () => {
    try {
      if (get().areAgentsLoaded) {
        return get().agents;
      }

      set({ loading: true, error: null });
      const agents = await fetchAgents();
      set({ agents, loading: false, areAgentsLoaded: true });
      return agents;
    } catch (error) {
      console.error('Error in loadAgents:', error);
      set({ error: 'Error fetching agents', loading: false });
      throw error;
    }
  },

  loadAgent: async (id) => {
    const existingAgent = get().agents.find((agent) => agent.id == id);
    if (existingAgent) {
      return existingAgent;
    }

    set({ loading: true, error: null });
    try {
      const agent = await fetchAgent(id);
      return agent;
    } catch (error) {
      set({ error: 'Error fetching agent', loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addAgent: async (agentData) => {
    try {
      set({ error: null });
      const agentId = await createAgent(agentData);
      if (agentId) {
        set({ areAgentsLoaded: false });
        await useAgentsStore.getState().loadAgents();
        return agentId; // Return the created agent ID
      }
      return false;
    } catch (error) {
      console.error('Error in addAgent:', error);

      // Extract error message from the response
      let errorMessage = 'Error creating agent';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      set({ error: errorMessage });
      throw error;
    }
  },

  editAgent: async (id, agentData) => {
    try {
      set({ error: null });
      const success = await updateAgent(id, agentData);
      if (success) {
        set({ areAgentsLoaded: false });
        await useAgentsStore.getState().loadAgents();
      }
    } catch (error) {
      console.error('Error in editAgent:', error);

      // Extract error message from the response
      let errorMessage = 'Error updating agent';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      set({ error: errorMessage });
      throw error;
    }
  },

  removeAgent: async (id) => {
    try {
      set({ error: null });
      const success = await deleteAgent(id);
      if (success) {
        set({ areAgentsLoaded: false });
        await useAgentsStore.getState().loadAgents();
      }
    } catch (error) {
      console.error('Error in removeAgent:', error);
      set({ error: 'Error deleting agent' });
      throw error;
    }
  },
}));

export default useAgentsStore;
