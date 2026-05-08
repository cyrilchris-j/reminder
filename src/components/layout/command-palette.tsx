// ============================================
// MindFlow — Command Palette (⌘K)
// Unified search + quick actions
// ============================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  StickyNote, CheckSquare, Bell, FolderOpen, Search, User,
  CalendarDays, Trash2, Moon, Sun, Plus, Settings, LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/stores/app-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Note, Task } from "@/types/database";

// Quick actions
const actions = [
  { id: "new-note", label: "New Note", icon: Plus, section: "Actions", href: "/dashboard/notes/new" },
  { id: "new-task", label: "New Task", icon: Plus, section: "Actions", href: "/dashboard/tasks" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Navigate", href: "/dashboard" },
  { id: "notes", label: "Notes", icon: StickyNote, section: "Navigate", href: "/dashboard/notes" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, section: "Navigate", href: "/dashboard/tasks" },
  { id: "reminders", label: "Reminders", icon: Bell, section: "Navigate", href: "/dashboard/reminders" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, section: "Navigate", href: "/dashboard/calendar" },
  { id: "folders", label: "Folders", icon: FolderOpen, section: "Navigate", href: "/dashboard/folders" },
  { id: "search", label: "Search", icon: Search, section: "Navigate", href: "/dashboard/search" },
  { id: "trash", label: "Trash", icon: Trash2, section: "Navigate", href: "/dashboard/trash" },
  { id: "profile", label: "Profile", icon: User, section: "Navigate", href: "/dashboard/profile" },
  { id: "settings", label: "Settings", icon: Settings, section: "Navigate", href: "/dashboard/profile" },
];

export function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; label: string; icon: React.ElementType; section: string; href: string }>>([]);

  // Filter actions based on query
  const filteredActions = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  // Search notes and tasks
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      const supabase = createClient();
      const term = `%${query}%`;

      const { data: notes } = await supabase
        .from("notes")
        .select("id, title")
        .eq("is_deleted", false)
        .ilike("title", term)
        .limit(5);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("is_deleted", false)
        .ilike("title", term)
        .limit(5);

      const results: typeof searchResults = [];
      if (notes) {
        notes.forEach((n) => results.push({
          id: `note-${n.id}`, label: n.title, icon: StickyNote, section: "Notes",
          href: `/dashboard/notes/${n.id}`,
        }));
      }
      if (tasks) {
        tasks.forEach((t) => results.push({
          id: `task-${t.id}`, label: t.title, icon: CheckSquare, section: "Tasks",
          href: "/dashboard/tasks",
        }));
      }
      setSearchResults(results);
    }, 200);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const allItems = [...searchResults, ...filteredActions];

  // Theme toggle action
  const themeAction = {
    id: "toggle-theme",
    label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
    icon: theme === "dark" ? Sun : Moon,
    section: "Actions",
    href: "",
  };

  if (query.toLowerCase().includes("dark") || query.toLowerCase().includes("light") || query.toLowerCase().includes("theme")) {
    allItems.unshift(themeAction);
  }

  const handleSelect = useCallback((item: typeof allItems[0]) => {
    setCommandPaletteOpen(false);
    setQuery("");
    if (item.id === "toggle-theme") {
      setTheme(theme === "dark" ? "light" : "dark");
    } else if (item.href) {
      router.push(item.href);
    }
  }, [router, setCommandPaletteOpen, setTheme, theme]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && allItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(allItems[selectedIndex]);
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, selectedIndex, allItems, handleSelect, setCommandPaletteOpen]);

  // Reset on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  // Group items by section
  const sections = new Map<string, typeof allItems>();
  allItems.forEach((item) => {
    const existing = sections.get(item.section) || [];
    existing.push(item);
    sections.set(item.section, existing);
  });

  let globalIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => { setCommandPaletteOpen(false); setQuery(""); }}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search or type a command..."
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            Array.from(sections.entries()).map(([section, items]) => (
              <div key={section}>
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section}
                </p>
                {items.map((item) => {
                  globalIndex++;
                  const idx = globalIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        selectedIndex === idx ? "bg-accent text-accent-foreground" : "text-foreground/80"
                      )}
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.section === "Actions" && (
                        <span className="text-[10px] text-muted-foreground">Action</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <kbd className="rounded border bg-muted px-1">↑↓</kbd> Navigate
            <kbd className="rounded border bg-muted px-1">↵</kbd> Select
          </div>
          <span className="text-[10px] text-muted-foreground">⌘K to toggle</span>
        </div>
      </div>
    </>
  );
}
