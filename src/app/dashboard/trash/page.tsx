// ============================================
// MindFlow — Trash Page (soft-deleted items)
// ============================================
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, RotateCcw, StickyNote, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Note, Task } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TrashPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    const supabase = createClient();
    const { data: n } = await supabase.from("notes").select("*").eq("is_deleted", true).order("deleted_at", { ascending: false });
    const { data: t } = await supabase.from("tasks").select("*").eq("is_deleted", true).order("deleted_at", { ascending: false });
    setNotes((n as Note[]) || []);
    setTasks((t as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTrash(); }, []);

  const restore = async (type: "notes" | "tasks", id: string) => {
    const supabase = createClient();
    await supabase.from(type).update({ is_deleted: false, deleted_at: null }).eq("id", id);
    toast.success("Restored!");
    fetchTrash();
  };

  const permanentDelete = async (type: "notes" | "tasks", id: string) => {
    const supabase = createClient();
    await supabase.from(type).delete().eq("id", id);
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
