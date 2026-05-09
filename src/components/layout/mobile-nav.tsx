"use client";
// ============================================
// MindFlow — Mobile Navigation
// ============================================

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, StickyNote, CheckSquare, Bell, Plus,
  Menu, Search, Moon, Sun, LogOut, User, Brain,
  FolderOpen, Trash2, CalendarDays,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MobileNavProps {
  user: { id: string; email?: string; full_name?: string; avatar_url?: string; } | null;
}

const bottomTabs = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: StickyNote, label: "Notes", href: "/dashboard/notes" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks" },
  { icon: Bell, label: "Alerts", href: "/dashboard/reminders" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: StickyNote, label: "Notes", href: "/dashboard/notes" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks" },
  { icon: Bell, label: "Reminders", href: "/dashboard/reminders" },
  { icon: CalendarDays, label: "Calendar", href: "/dashboard/calendar" },
  { icon: FolderOpen, label: "Folders", href: "/dashboard/folders" },
  { icon: Search, label: "Search", href: "/dashboard/search" },
  { icon: Trash2, label: "Trash", href: "/dashboard/trash" },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      {/* Top Bar (Mobile) */}
      <header className="hide-desktop sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={
            <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          } />
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center gap-2.5 p-4 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">MindFlow</span>
            </div>
            <Separator />
            <nav className="space-y-1 p-3">
              {menuItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-accent")}>
                    <item.icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Separator />
            <div className="p-3 space-y-1">
              <button onClick={() => { router.push("/dashboard/profile"); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/70 hover:bg-accent transition-colors">
                <User className="h-[18px] w-[18px]" /> Profile
              </button>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/70 hover:bg-accent transition-colors">
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="h-[18px] w-[18px]" /> Log out
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 border-t p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user?.avatar_url ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user?.full_name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">MindFlow</span>
        </div>

        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors" onClick={() => router.push("/dashboard/search")}>
          <Search className="h-5 w-5" />
        </button>
      </header>

      {/* Bottom Tab Bar */}
      <nav className="hide-desktop fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background/90 px-2 backdrop-blur-xl">
        {bottomTabs.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors", active ? "text-primary" : "text-muted-foreground")}>
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => router.push("/dashboard/notes/new")} className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/30 -translate-y-3 transition-transform active:scale-95">
          <Plus className="h-5 w-5" />
        </button>
      </nav>
    </>
  );
}
