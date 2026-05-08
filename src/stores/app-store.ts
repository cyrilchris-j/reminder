// ============================================
// MindFlow — App-wide Zustand Store
// ============================================
import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeSection: 'dashboard' | 'notes' | 'tasks' | 'reminders' | 'calendar' | 'folders' | 'trash' | 'search' | 'profile';
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveSection: (section: AppState['activeSection']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeSection: 'dashboard',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setActiveSection: (section) => set({ activeSection: section }),
}));
