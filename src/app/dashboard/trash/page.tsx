"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
// ============================================
// MindFlow — Trash Page (soft-deleted items)
// ============================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, RotateCcw, StickyNote, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Note, Task } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TrashPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Fetch deleted notes
      const notesRef = collection(db, "notes");
      const notesQ = query(notesRef, where("user_id", "==", user.uid));
      const notesSnapshot = await getDocs(notesQ);
      const allNotes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
      const deletedNotes = allNotes
        .filter(n => n.is_deleted)
        .sort((a, b) => new Date(b.deleted_at || 0).getTime() - new Date(a.deleted_at || 0).getTime());

      // Fetch deleted tasks
      const tasksRef = collection(db, "tasks");
      const tasksQ = query(tasksRef, where("user_id", "==", user.uid));
      const tasksSnapshot = await getDocs(tasksQ);
      const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      const deletedTasks = allTasks
        .filter(t => t.is_deleted)
        .sort((a, b) => new Date(b.deleted_at || 0).getTime() - new Date(a.deleted_at || 0).getTime());

      setNotes(deletedNotes);
      setTasks(deletedTasks);
    } catch (error) {
      console.error("Error fetching trash:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchTrash();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const restore = async (type: "notes" | "tasks", id: string) => {
    await updateDoc(doc(db, type, id), { 
      is_deleted: false, 
      deleted_at: null,
      updated_at: new Date().toISOString()
    });
    toast.success("Restored!");
    fetchTrash();
  };

  const permanentDelete = async (type: "notes" | "tasks", id: string) => {
    await deleteDoc(doc(db, type, id));
    toast.success("Permanently deleted");
    fetchTrash();
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-32" />{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Trash</h1><p className="text-sm text-muted-foreground">Recover or permanently delete items</p></div>

      <Tabs defaultValue="notes">
        <TabsList><TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger><TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger></TabsList>
        <TabsContent value="notes" className="mt-4 space-y-2">
          {notes.length === 0 ? <EmptyTrash icon={StickyNote} label="No deleted notes" /> : notes.map(n => (
            <TrashItem key={n.id} title={n.title} subtitle={n.deleted_at ? format(new Date(n.deleted_at), "MMM d, h:mm a") : ""} icon={StickyNote}
              onRestore={() => restore("notes", n.id)} onDelete={() => permanentDelete("notes", n.id)} />
          ))}
        </TabsContent>
        <TabsContent value="tasks" className="mt-4 space-y-2">
          {tasks.length === 0 ? <EmptyTrash icon={CheckSquare} label="No deleted tasks" /> : tasks.map(t => (
            <TrashItem key={t.id} title={t.title} subtitle={t.deleted_at ? format(new Date(t.deleted_at), "MMM d, h:mm a") : ""} icon={CheckSquare}
              onRestore={() => restore("tasks", t.id)} onDelete={() => permanentDelete("tasks", t.id)} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TrashItem({ title, subtitle, icon: Icon, onRestore, onDelete }: { title: string; subtitle: string; icon: React.ElementType; onRestore: () => void; onDelete: () => void }) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-xl bg-muted p-2.5"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{title}</p><p className="text-[11px] text-muted-foreground">Deleted {subtitle}</p></div>
        <Button variant="outline" size="sm" onClick={onRestore}><RotateCcw className="mr-1 h-3.5 w-3.5" />Restore</Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </CardContent>
    </Card>
  );
}

function EmptyTrash({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center py-16"><div className="mb-3 rounded-3xl bg-muted p-5"><Icon className="h-8 w-8 text-muted-foreground" /></div><p className="text-sm font-medium text-muted-foreground">{label}</p></div>
  );
}
