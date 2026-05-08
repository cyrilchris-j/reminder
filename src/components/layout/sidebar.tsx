// ============================================
// MindFlow — Sidebar Component
// Collapsible navigation with sections & user menu
// ============================================
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, StickyNote, CheckSquare, Bell, CalendarDays,
  FolderOpen, Search, Trash2, Settings, LogOut, Moon, Sun,
  ChevronLeft, ChevronRight, Brain, Plus, User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/stores/app-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: { id: string; email?: string; full_name?: string; avatar_url?: string; } | null;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: StickyNote, label: "Notes", href: "/dashboard/notes" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks" },
  { icon: Bell, label: "Reminders", href: "/dashboard/reminders" },
  { icon: CalendarDays, label: "Calendar", href: "/dashboard/calendar" },
  { icon: FolderOpen, label: "Folders", href: "/dashboard/folders" },
];

const bottomItems = [
  { icon: Search, label: "Search", href: "/dashboard/search" },
  { icon: Trash2, label: "Trash", href: "/dashboard/trash" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useAppStore();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative z-20 flex h-screen flex-col border-r border-sidebar-border bg-sidebar hide-mobile"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden">
                MindFlow
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Tooltip>
          <TooltipTrigger render={
            <button className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors" onClick={toggleSidebarCollapsed}>
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          } />
          <TooltipContent side="right">{sidebarCollapsed ? "Expand" : "Collapse"} sidebar</TooltipContent>
        </Tooltip>
      </div>

      {/* Quick Add */}
      <div className="px-3 mb-2">
        <Tooltip>
          <TooltipTrigger render={
            <button
              className={cn("w-full gradient-primary border-0 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 rounded-md h-9 px-4 text-sm font-medium flex items-center", sidebarCollapsed ? "justify-center px-0" : "justify-start")}
              onClick={() => router.push("/dashboard/notes/new")}
            >
              <Plus className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
              {!sidebarCollapsed && <span>New Note</span>}
            </button>
          } />
          {sidebarCollapsed && <TooltipContent side="right">New Note</TooltipContent>}
        </Tooltip>
      </div>

      <Separator className="mx-3" />

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={
                <Link href={item.href} className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active ? "bg-primary/10 text-primary shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-0"
                )}>
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">{item.label}</motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              } />
              {sidebarCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          );
        })}

        <Separator className="my-3" />

        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={
                <Link href={item.href} className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active ? "bg-primary/10 text-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-0"
                )}>
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              } />
              {sidebarCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent", sidebarCollapsed && "justify-center px-0")}>
              <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/20">
                <AvatarImage src={user?.avatar_url ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="truncate font-medium text-xs">{user?.full_name || "User"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                </div>
              )}
            </button>
          } />
          <DropdownMenuContent side={sidebarCollapsed ? "right" : "top"} align="start" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
