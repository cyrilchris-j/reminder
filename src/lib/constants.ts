// ============================================
// MindFlow — Constants
// ============================================

export const APP_NAME = 'MindFlow';
export const APP_DESCRIPTION = 'Your beautiful, blazing-fast notes, reminders & tasks companion.';

// Note colors (pastel palette)
export const NOTE_COLORS = [
  { name: 'Default', value: 'transparent' },
  { name: 'Rose', value: '#ffe4e6' },
  { name: 'Peach', value: '#fed7aa' },
  { name: 'Amber', value: '#fef08a' },
  { name: 'Lime', value: '#d9f99d' },
  { name: 'Emerald', value: '#a7f3d0' },
  { name: 'Sky', value: '#bae6fd' },
  { name: 'Violet', value: '#ddd6fe' },
  { name: 'Pink', value: '#fbcfe8' },
] as const;

// Dark mode note colors
export const NOTE_COLORS_DARK = [
  { name: 'Default', value: 'transparent' },
  { name: 'Rose', value: '#4c1d2e' },
  { name: 'Peach', value: '#4a2c17' },
  { name: 'Amber', value: '#3d3117' },
  { name: 'Lime', value: '#2a3a16' },
  { name: 'Emerald', value: '#1a3a2a' },
  { name: 'Sky', value: '#1a2e3d' },
  { name: 'Violet', value: '#2d2347' },
  { name: 'Pink', value: '#3d1f35' },
] as const;

// Priority configs
export const PRIORITIES = {
  high: { label: 'High', color: '#ef4444', icon: '🔴' },
  medium: { label: 'Medium', color: '#f59e0b', icon: '🟡' },
  low: { label: 'Low', color: '#22c55e', icon: '🟢' },
} as const;

// Folder icons
export const FOLDER_ICONS = [
  'folder', 'book', 'briefcase', 'heart', 'star',
  'code', 'music', 'camera', 'globe', 'coffee',
  'graduation-cap', 'lightbulb', 'rocket', 'shield', 'zap',
] as const;

// Folder colors
export const FOLDER_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6b7280',
] as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  newNote: { key: 'n', meta: true, label: '⌘N — New Note' },
  newTask: { key: 't', meta: true, label: '⌘T — New Task' },
  search: { key: 'k', meta: true, label: '⌘K — Search' },
  toggleSidebar: { key: 'b', meta: true, label: '⌘B — Toggle Sidebar' },
  toggleDarkMode: { key: 'd', meta: true, shift: true, label: '⌘⇧D — Dark Mode' },
} as const;

// Motivational quotes for dashboard
export const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "It's not about ideas. It's about making ideas happen. — Scott Belsky",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "The way to get started is to quit talking and begin doing. — Walt Disney",
  "Your mind is for having ideas, not holding them. — David Allen",
  "One thing at a time. Most important thing first. — Peter Drucker",
  "The journey of a thousand miles begins with one step. — Lao Tzu",
  "Small daily improvements lead to stunning results. — Robin Sharma",
  "Done is better than perfect. — Sheryl Sandberg",
  "What gets measured gets managed. — Peter Drucker",
] as const;
