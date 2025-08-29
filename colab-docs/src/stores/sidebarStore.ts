import { create } from 'zustand'

interface SidebarState {
  isExpanded: boolean;
  onToggle: () => void;
}

export const useSidebar = create<SidebarState>()((set) => ({
  isExpanded: false,
  onToggle: () => set(
    (state) => ({ isExpanded: !state.isExpanded })),
}))
