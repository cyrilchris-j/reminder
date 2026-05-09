import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, StickyNote, CheckSquare, Bell, Plus,
  Menu, Search, Moon, Sun, LogOut, User, Brain,
  FolderOpen, Trash2, CalendarDays, Settings, Sparkles, X
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: StickyNote, label: "My Notes", href: "/dashboard/notes", color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: Bell, label: "Reminders", href: "/dashboard/reminders", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: CalendarDays, label: "Calendar", href: "/dashboard/calendar", color: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: FolderOpen, label: "Folders", href: "/dashboard/folders", color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Define routes where the global mobile navigation should be HIDDEN to provide focus
  const isFocusedPage = pathname.includes("/notes/") || 
                        pathname.includes("/tasks/kanban") || 
                        pathname.includes("/profile");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (isFocusedPage) return null;

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
      {/* Floating Header */}
      <header className="hide-desktop fixed top-4 left-4 right-4 z-40 flex h-14 items-center justify-between rounded-2xl border border-white/20 bg-background/60 px-4 backdrop-blur-xl shadow-lg shadow-black/5 ring-1 ring-black/5 transition-all">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-all active:scale-95">
              <Menu className="h-5 w-5 text-foreground/70" />
            </button>
          } />
          <SheetContent side="left" className="w-[85%] max-w-[400px] border-r-0 bg-background/95 p-0 backdrop-blur-2xl">
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">MindFlow</h2>
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Premium Workspace</p>
                    </div>
                  </div>
                  <SheetClose render={
                    <button className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/50">
                      <X className="h-4 w-4" />
                    </button>
                  } />
                </div>

                <div className="flex items-center gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={user?.avatar_url ?? ""} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold truncate">{user?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Grid */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Main Menu</p>
                <div className="grid grid-cols-2 gap-2">
                  {menuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                        className={cn("flex flex-col items-center gap-3 rounded-[2rem] p-4 transition-all active:scale-95 border border-transparent",
                          active ? "bg-primary/10 border-primary/20" : "bg-muted/30 hover:bg-muted/50")}>
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", item.bg)}>
                          <item.icon className={cn("h-5 w-5", item.color)} />
                        </div>
                        <span className={cn("text-xs font-bold", active ? "text-primary" : "text-foreground/70")}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-8 space-y-1">
                  <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">System</p>
                  <button onClick={() => { router.push("/dashboard/search"); setOpen(false); }} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground/70 hover:bg-muted/50 transition-all">
                    <Search className="h-5 w-5" /> Search Space
                  </button>
                  <button onClick={() => { router.push("/dashboard/trash"); setOpen(false); }} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground/70 hover:bg-muted/50 transition-all">
                    <Trash2 className="h-5 w-5" /> Trash Bin
                  </button>
                  <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground/70 hover:bg-muted/50 transition-all">
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 pt-2">
                <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3.5 text-sm font-bold text-destructive hover:bg-destructive/20 transition-all active:scale-95">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">MindFlow</span>
        </div>

        <button onClick={() => router.push("/dashboard/search")} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-all active:scale-95">
          <Search className="h-5 w-5 text-foreground/70" />
        </button>
      </header>

      {/* Modern Floating Bottom Nav */}
      <nav className="hide-desktop fixed bottom-6 left-6 right-6 z-40 h-16 flex items-center px-2 rounded-[2rem] border border-white/20 bg-background/60 backdrop-blur-2xl shadow-2xl shadow-black/10 transition-all">
        <div className="flex flex-1 items-center justify-around">
          {bottomTabs.slice(0, 2).map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-90", active ? "text-primary" : "text-muted-foreground")}>
                <item.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}

          {/* Centered FAB */}
          <div className="relative -mt-12">
            <button onClick={() => router.push("/dashboard/notes/new")} 
              className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-white shadow-xl shadow-primary/40 transition-all hover:scale-110 active:scale-95 ring-4 ring-background">
              <Plus className="h-8 w-8" />
            </button>
          </div>

          {bottomTabs.slice(2, 4).map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 transition-all active:scale-90", active ? "text-primary" : "text-muted-foreground")}>
                <item.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Safe Area Spacer for Bottom Nav */}
      <div className="hide-desktop h-28" />
    </>
  );
}
