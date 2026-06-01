import { create } from 'zustand';

export const useMenuStore = create((set, get) => ({
  stack: [],
  direction: 'forward',
  push: (item) =>
    set((state) => ({
      stack: [...state.stack, item],
      direction: 'forward',
    })),
  pop: () =>
    set((state) => {
      const newStack = [...state.stack];
      newStack.pop();
      return { stack: newStack, direction: 'backward' };
    }),
  reset: () => set({ stack: [], direction: 'forward' }), 
}));
