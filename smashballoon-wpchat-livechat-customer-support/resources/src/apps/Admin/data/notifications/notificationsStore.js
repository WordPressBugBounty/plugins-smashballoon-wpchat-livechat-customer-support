import { create } from 'zustand';
import { fetchNotifications, dismissNotification } from './notificationsApi';

const useNotificationsStore = create((set, get) => ({
  notifications: [],
  count: window.wpChatAdmin?.notificationCount || 0,
  loading: false,
  fetched: false,
  isExpanded: false,

  setExpanded: (val) => set({ isExpanded: val }),

  fetch: async () => {
    if (get().fetched || get().loading) {
      return;
    }

    set({ loading: true });
    try {
      const data = await fetchNotifications();
      set({
        notifications: data.notifications || [],
        count: data.count || 0,
        loading: false,
        fetched: true,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ loading: false, fetched: true });
    }
  },

  refetch: async () => {
    set({ fetched: false, loading: false });
    await get().fetch();
  },

  dismiss: async (id) => {
    try {
      await dismissNotification(id);
      set((state) => {
        const notifications = state.notifications.filter(
          (n) => String(n.id) !== String(id),
        );
        return {
          notifications,
          count: notifications.length,
        };
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  },
}));

export default useNotificationsStore;
