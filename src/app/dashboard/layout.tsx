"use client";
// ============================================
// Dashboard Layout — Sidebar + Content area
// ============================================

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Brain className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Loading your workspace...</p>
      </div>
    );
  }

  if (!user) return null; // handled by AuthProvider redirect

  const userData = {
    id: user.uid,
    email: user.email,
    full_name: user.displayName || "User",
    avatar_url: user.photoURL || null,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar user={userData as any} />

      {/* Mobile Nav */}
      <MobileNav user={userData as any} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <DashboardShell>{children}</DashboardShell>
        </div>
      </main>
    </div>
  );
}
