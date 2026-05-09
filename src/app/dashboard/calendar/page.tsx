"use client";
// ============================================
// MindFlow — Calendar View Page
// ============================================

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckSquare, Bell } from "lucide-react";
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
        const start = startOfMonth(currentMonth).toISOString();
        const end = endOfMonth(currentMonth).toISOString();
        
        // Fetch tasks
        const tasksRef = collection(db, "tasks");
        const qt = query(
          tasksRef, 
          where("user_id", "==", user.uid), 
          where("is_deleted", "==", false),
          where("due_date", ">=", start),
          where("due_date", "<=", end)
        );
        const snapshotTasks = await getDocs(qt);
        setTasks(snapshotTasks.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));

        // Fetch reminders
        const remindersRef = collection(db, "reminders");
        const qr = query(
          remindersRef, 
          where("user_id", "==", user.uid), 
          where("is_active", "==", true),
          where("remind_at", ">=", start),
          where("remind_at", "<=", end)
        );
        const snapshotReminders = await getDocs(qr);
        setReminders(snapshotReminders.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder)));
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: days.startPad }).map((_, i) => <div key={`pad-${i}`} className="min-h-[80px] border-t border-r border-border/30 bg-muted/10" />)}
          {days.interval.map(day => {
            const items = getItemsForDay(day);
            const hasItems = items.tasks.length > 0 || items.reminders.length > 0;
            const selected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                className={cn("min-h-[80px] border-t border-r border-border/30 p-1.5 text-left transition-colors hover:bg-accent/50 relative",
                  isToday(day) && "bg-primary/5", selected && "bg-primary/10 ring-2 ring-primary ring-inset")}>
                <span className={cn("text-xs font-medium", isToday(day) && "text-primary font-bold")}>{format(day, "d")}</span>
                {hasItems && (
                  <div className="mt-1 space-y-0.5">
                    {items.tasks.slice(0, 2).map(t => (
                      <div key={t.id} className={cn("text-[9px] truncate rounded px-1 py-0.5",
                        t.priority === "high" ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary")}>{t.title}</div>
                    ))}
                    {items.reminders.slice(0, 1).map(r => (
                      <div key={r.id} className="text-[9px] truncate rounded px-1 py-0.5 bg-amber-500/10 text-amber-600">{r.title}</div>
                    ))}
                    {(items.tasks.length + items.reminders.length > 3) && (
                      <span className="text-[9px] text-muted-foreground">+{items.tasks.length + items.reminders.length - 3} more</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && selectedItems && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">{format(selectedDate, "EEEE, MMMM d")}</h3>
              {selectedItems.tasks.length === 0 && selectedItems.reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2">
                      <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm">{t.title}</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto">{t.priority}</Badge>
                    </div>
                  ))}
                  {selectedItems.reminders.map(r => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg bg-amber-500/5 px-3 py-2">
                      <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">{format(new Date(r.remind_at), "h:mm a")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
