import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  width: number;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebar = create<SidebarState>()((set) => ({
  isOpen: false,
  width: 320,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
