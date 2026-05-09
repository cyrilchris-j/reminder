"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, orderBy } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
// ============================================
// MindFlow — Reminders Page
// ============================================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Clock, Repeat, Trash2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Reminder, RepeatType } from "@/types/database";
import { format, isPast, isFuture, addDays } from "date-fns";
import { toast } from "sonner";

export default function RemindersPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeatType, setRepeatType] = useState<RepeatType>("once");
  const [saving, setSaving] = useState(false);

  const fetchReminders = async () => {
    if (!authUser) return;

    try {
      // Simplify query to avoid index requirements
      const remindersRef = collection(db, "reminders");
      const q = query(remindersRef, where("user_id", "==", authUser.uid));
      const snapshot = await getDocs(q);
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
      
      // Filter and sort client-side
      const activeReminders = allData
        .filter(r => r.is_active)
        .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime());
      
      setReminders(activeReminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      // Fallback
      setReminders([
        { id: "m-r1", title: "Morning Standup", remind_at: addDays(new Date(), 1).toISOString(), repeat_type: "daily", is_active: true } as any,
        { id: "m-r2", title: "Call Mom", remind_at: addDays(new Date(), 2).toISOString(), repeat_type: "weekly", is_active: true } as any,
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (!authLoading) {
      if (authUser) fetchReminders();
      else setLoading(false);
    }
  }, [authUser, authLoading]);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !remindAt) { toast.error("Enter title and time"); return; }
    
    setSaving(true);
    try {
      const reminderData = {
        user_id: authUser?.uid, 
        title: title.trim(), 
        remind_at: new Date(remindAt).toISOString(),
        repeat_type: repeatType, 
        task_id: null, 
        note_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "reminders"), reminderData);
      
      // OPTIONAL: Automatically create a task if it's a "remind me to..."
      await addDoc(collection(db, "tasks"), {
        user_id: authUser?.uid,
        title: title.trim(),
        description: `Reminder scheduled for ${format(new Date(remindAt), "PPp")}`,
        is_completed: false,
        is_deleted: false,
        priority: "medium",
        due_date: new Date(remindAt).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setTitle(""); setRemindAt(""); setRepeatType("once");
      toast.success("Reminder & Task added!");
      fetchReminders();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await updateDoc(doc(db, "reminders", id), { 
        is_active: false,
        updated_at: new Date().toISOString()
      });
      toast.success("Removed");
      fetchReminders();
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const upcomingReminders = reminders.filter(r => isFuture(new Date(r.remind_at)));
  const pastReminders = reminders.filter(r => isPast(new Date(r.remind_at)));

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/30 bg-clip-text text-transparent">Reminders</h1>
        <p className="text-muted-foreground text-lg">Stay ahead of your schedule with smart alerts</p>
      </div>

      {/* Modern Quick Add */}
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 shadow-2xl shadow-primary/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Bell className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What should we remind you about?" 
                  className="h-14 pl-12 bg-background/50 border-primary/10 focus:border-primary/30 rounded-2xl text-lg shadow-inner" />
              </div>
              <div className="md:w-64 relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                <Input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)} 
                  className="h-14 pl-12 bg-background/50 border-primary/10 focus:border-primary/30 rounded-2xl shadow-inner" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Select value={repeatType} onValueChange={v => setRepeatType(v as RepeatType)}>
                  <SelectTrigger className="w-[140px] h-10 rounded-xl bg-background/50 border-primary/10">
                    <SelectValue placeholder="Repeat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="px-3 py-1 rounded-full bg-primary/10 text-primary border-0 font-medium">Auto-Task Enabled</Badge>
              </div>
              <Button type="submit" disabled={saving} className="h-12 px-8 rounded-2xl gradient-primary border-0 text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                Set Reminder
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
            <div className="h-20 w-20 rounded-[2.5rem] bg-muted flex items-center justify-center">
              <Bell className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Clear Skies</h3>
              <p className="text-sm">No reminders scheduled at the moment</p>
            </div>
          </div>
        ) : (
          <>
            {upcomingReminders.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Upcoming</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
                <div className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {upcomingReminders.map((r, i) => (
                      <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                        <Card className="group border-0 bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/20 hover:bg-card/60 transition-all rounded-[1.5rem]">
                          <CardContent className="flex items-center gap-5 p-5">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Bell className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{r.title}</h4>
                              <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                <span className="text-xs flex items-center gap-1.5 font-medium"><Calendar className="h-3.5 w-3.5" />{format(new Date(r.remind_at), "MMM d, yyyy")}</span>
                                <span className="text-xs flex items-center gap-1.5 font-medium"><Clock className="h-3.5 w-3.5" />{format(new Date(r.remind_at), "h:mm a")}</span>
                              </div>
                            </div>
                            {r.repeat_type !== "once" && <Badge className="rounded-full bg-secondary text-[10px] uppercase tracking-tighter">{r.repeat_type}</Badge>}
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100" onClick={() => deleteReminder(r.id)}><Trash2 className="h-5 w-5" /></Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {pastReminders.length > 0 && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">History</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-muted to-transparent" />
                </div>
                <div className="grid gap-3 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                  {pastReminders.map(r => (
                    <div key={r.id} className="flex items-center gap-4 rounded-[1.25rem] bg-muted/20 p-4 border border-border/30">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Bell className="h-5 w-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(r.remind_at), "MMM d 'at' h:mm a")}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteReminder(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
