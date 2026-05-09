"use client";
// ============================================
// MindFlow — Calendar View Page
// ============================================

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckSquare, Bell, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task, Reminder } from "@/types/database";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from "date-fns";
import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export default function CalendarPage() {
  const [user] = useAuthState(auth);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        // Simplify query to avoid index requirements
        const tasksRef = collection(db, "tasks");
        const qt = query(tasksRef, where("user_id", "==", user.uid));
        const snapshotTasks = await getDocs(qt);
        const allTasks = snapshotTasks.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        
        const remindersRef = collection(db, "reminders");
        const qr = query(remindersRef, where("user_id", "==", user.uid));
        const snapshotReminders = await getDocs(qr);
        const allReminders = snapshotReminders.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));

        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);

        setTasks(allTasks.filter(t => !t.is_deleted && t.due_date && new Date(t.due_date) >= start && new Date(t.due_date) <= end));
        setReminders(allReminders.filter(r => r.is_active && new Date(r.remind_at) >= start && new Date(r.remind_at) <= end));
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      }
    };
    fetch();
  }, [currentMonth, user]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const interval = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart);
    return { interval, startPad };
  }, [currentMonth]);

  const getItemsForDay = (day: Date) => ({
    tasks: tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day)),
    reminders: reminders.filter(r => isSameDay(new Date(r.remind_at), day)),
  });

  const selectedItems = selectedDate ? getItemsForDay(selectedDate) : null;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">Calendar</h1>
          <p className="text-sm text-muted-foreground">Manage your schedule across time</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold px-2 min-w-[120px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
          <div className="grid grid-cols-7 border-b border-border/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="px-1 py-3 text-center text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {Array.from({ length: days.startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[70px] md:min-h-[100px] border-b border-r border-border/20 bg-muted/5" />
            ))}
            {days.interval.map(day => {
              const items = getItemsForDay(day);
              const hasItems = items.tasks.length > 0 || items.reminders.length > 0;
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={cn("min-h-[70px] md:min-h-[100px] min-w-0 border-b border-r border-border/20 p-1 md:p-2 text-left transition-all relative group overflow-hidden",
                    selected ? "bg-primary/5 ring-1 ring-primary/20 ring-inset" : "hover:bg-accent/30")}>
                  <span className={cn("text-[10px] md:text-xs font-bold transition-all", 
                    today ? "inline-flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-foreground/70 group-hover:text-foreground",
                    selected && !today && "text-primary"
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {hasItems && (
                    <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1">
                      <div className="flex gap-0.5 flex-wrap">
                        {items.tasks.slice(0, 3).map(t => (
                          <div key={t.id} className={cn("h-1 w-1 md:h-1 md:w-full rounded-full", t.priority === "high" ? "bg-red-500" : "bg-primary")} />
                        ))}
                      </div>
                      {items.reminders.length > 0 && <div className="h-0.5 md:h-1 w-full rounded-full bg-amber-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 flex flex-col shadow-xl overflow-hidden">
          {selectedDate ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-xl font-bold">{format(selectedDate, "EEEE")}</h3>
                <p className="text-sm text-muted-foreground">{format(selectedDate, "MMMM d, yyyy")}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {selectedItems?.tasks.length === 0 && selectedItems?.reminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <p className="text-sm">Nothing planned</p>
                  </div>
                ) : (
                  <>
                    {selectedItems?.tasks.map(t => (
                      <div key={t.id} className="group relative flex items-center gap-3 rounded-2xl bg-muted/30 p-3 transition-all hover:bg-muted/50 border border-transparent hover:border-primary/20">
                        <div className={cn("h-2 w-2 rounded-full", t.priority === "high" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-primary")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground">Task</p>
                        </div>
                      </div>
                    ))}
                    {selectedItems?.reminders.map(r => (
                      <div key={r.id} className="group relative flex items-center gap-3 rounded-2xl bg-amber-500/5 p-3 transition-all hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20">
                        <Bell className="h-4 w-4 text-amber-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(r.remind_at), "h:mm a")}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 animate-pulse">
                <CalendarDays className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium">Select a date to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
