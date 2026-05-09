"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, orderBy } from "firebase/firestore";
// ============================================
// MindFlow — Reminders Page
// ============================================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Clock, Repeat, Trash2, Calendar } from "lucide-react";
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
import { format, isPast, isFuture } from "date-fns";
import { toast } from "sonner";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeatType, setRepeatType] = useState<RepeatType>("once");
  const [saving, setSaving] = useState(false);

  const fetchReminders = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const remindersRef = collection(db, "reminders");
    const q = query(
      remindersRef,
      where("user_id", "==", user.uid),
      where("is_active", "==", true),
      orderBy("remind_at", "asc")
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setReminders((data as Reminder[]) || []);
    setLoading(false);
  };

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchReminders();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !remindAt) { toast.error("Fill in title and date"); return; }
    setSaving(true);
    const user = auth.currentUser;
    if (!user) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    try {
      await addDoc(collection(db, "reminders"), {
        user_id: user.uid, 
        title: title.trim(), 
        remind_at: new Date(remindAt).toISOString(),
        repeat_type: repeatType, 
        task_id: null, 
        note_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setTitle(""); setRemindAt(""); setRepeatType("once");
      setDialogOpen(false);
      toast.success("Reminder set!");
      fetchReminders();
    } catch (error) {
      console.error(error);
      toast.error("Failed to set reminder");
    } finally {
      setSaving(false);
    }
  };

  const deleteReminder = async (id: string) => {
    await updateDoc(doc(db, "reminders", id), { 
      is_active: false,
      updated_at: new Date().toISOString()
    });
    toast.success("Reminder removed");
    fetchReminders();
  };

  const upcomingReminders = reminders.filter(r => isFuture(new Date(r.remind_at)));
  const pastReminders = reminders.filter(r => isPast(new Date(r.remind_at)));

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          <p className="text-sm text-muted-foreground">{upcomingReminders.length} upcoming</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gradient-primary border-0 text-white shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" />New Reminder</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Set Reminder</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Remind me to..." className="mt-1" /></div>
              <div><Label>Date & Time</Label><Input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)} className="mt-1" /></div>
              <div><Label>Repeat</Label>
                <Select value={repeatType} onValueChange={v => setRepeatType(v as RepeatType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full gradient-primary border-0 text-white"><Bell className="mr-2 h-4 w-4" />Set Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 rounded-3xl bg-amber-500/10 p-5"><Bell className="h-10 w-10 text-amber-500" /></div>
          <h2 className="text-lg font-semibold">No reminders</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set reminders to never miss important things</p>
        </div>
      ) : (
        <>
          {upcomingReminders.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {upcomingReminders.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className="border-border/50 transition-all hover:border-primary/20">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="rounded-xl bg-amber-500/10 p-2.5"><Bell className="h-5 w-5 text-amber-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{r.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(r.remind_at), "MMM d, yyyy")}</span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(r.remind_at), "h:mm a")}</span>
                            </div>
                          </div>
                          {r.repeat_type !== "once" && <Badge variant="secondary" className="text-[10px]"><Repeat className="mr-1 h-3 w-3" />{r.repeat_type}</Badge>}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteReminder(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          {pastReminders.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past</h2>
              <div className="space-y-2 opacity-60">
                {pastReminders.map(r => (
                  <Card key={r.id} className="border-border/50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-xl bg-muted p-2.5"><Bell className="h-5 w-5 text-muted-foreground" /></div>
                      <div className="flex-1"><p className="text-sm font-medium">{r.title}</p><p className="text-[11px] text-muted-foreground">{format(new Date(r.remind_at), "MMM d 'at' h:mm a")}</p></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteReminder(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
