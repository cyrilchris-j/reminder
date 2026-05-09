"use client";
// ============================================
// MindFlow — Dashboard Client Shell
// Wraps client-only features (shortcuts, command palette)
// ============================================

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { CommandPalette } from "@/components/layout/command-palette";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <>
      <CommandPalette />
      {children}
    </>
  );
}
