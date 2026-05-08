// ============================================
// MindFlow — Keyboard Shortcuts Hook
// ============================================
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppStore } from "@/stores/app-store";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setCommandPaletteOpen, toggleSidebarCollapsed } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with meta (⌘) or ctrl key
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // ⌘K — Command palette / Search
      if (e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // ⌘N — New note
      if (e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        router.push("/dashboard/notes/new");
      }

      // ⌘B — Toggle sidebar
      if (e.key === "b") {
        e.preventDefault();
        toggleSidebarCollapsed();
      }

      // ⌘⇧D — Toggle dark mode
      if (e.key === "d" && e.shiftKey) {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }

      // ⌘/ — Show shortcuts help (could open a dialog)
      if (e.key === "/") {
        e.preventDefault();
        // Can be extended to show shortcuts modal
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, theme, setTheme, setCommandPaletteOpen, toggleSidebarCollapsed]);
}
