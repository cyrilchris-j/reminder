init"use client";

import { useEffect, useState } from "react";
import { Download, Bell, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // 1. Handle Install Prompt (PWA)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay on mobile
      if (window.innerWidth < 768) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 2. Check Notification Permission
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        // Show notification request after some usage
        setTimeout(() => setShowNotificationPrompt(true), 5000);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("Thank you for installing MindFlow!");
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleRequestNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notifications enabled! You'll receive real-time alerts.");
      } else {
        toast.error("Notifications disabled. You can change this in your browser settings.");
      }
    } catch (error) {
      console.error("Error requesting notifications:", error);
    } finally {
      setShowNotificationPrompt(false);
    }
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-4 px-4">
      <AnimatePresence>
        {/* Install Prompt */}
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="pointer-events-auto w-full max-w-sm rounded-3xl bg-background/80 p-4 shadow-2xl backdrop-blur-2xl border border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/30">
                <Download className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-sm font-bold truncate">Install MindFlow</h3>
                <p className="text-xs text-muted-foreground">Add to home screen for the best experience.</p>
              </div>
              <button onClick={() => setShowInstallPrompt(false)} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleInstall} className="flex-1 gradient-primary border-0 text-white font-bold h-10 rounded-xl shadow-md">
                Install App
              </Button>
              <Button variant="outline" onClick={() => setShowInstallPrompt(false)} className="h-10 rounded-xl">
                Maybe later
              </Button>
            </div>
          </motion.div>
        )}

        {/* Notification Prompt */}
        {showNotificationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="pointer-events-auto w-full max-w-sm rounded-3xl bg-background/80 p-4 shadow-2xl backdrop-blur-2xl border border-emerald-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <Bell className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-sm font-bold truncate">Enable Notifications</h3>
                <p className="text-xs text-muted-foreground">Get real-time alerts and smart reminders.</p>
              </div>
              <button onClick={() => setShowNotificationPrompt(false)} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleRequestNotifications} className="flex-1 bg-emerald-500 hover:bg-emerald-600 border-0 text-white font-bold h-10 rounded-xl shadow-md">
                Allow Notifications
              </Button>
              <Button variant="outline" onClick={() => setShowNotificationPrompt(false)} className="h-10 rounded-xl">
                Not now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
