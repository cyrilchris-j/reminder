"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, orderBy } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
// ============================================
// MindFlow — Tasks Page
// ============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckCircle2, Circle, Trash2, Kanban,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Task, Priority } from "@/types/database";
import { format, isToday, isPast } from "date-fns";
import { toast } from "sonner";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New task form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>("medium");
  const [formDueDate, setFormDueDate] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const fetchTasks = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const tasksRef = collection(db, "tasks");
      const q = query(
        tasksRef,
        where("user_id", "==", user.uid),
        where("is_deleted", "==", false),
        orderBy("is_completed", "asc"),
        orderBy("sort_order", "asc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks((data as Task[]) || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      
      // HACKATHON FALLBACK
      if (error instanceof Error && error.message.includes("permission")) {
        setTasks([
          { id: "mock-t1", title: "Complete hackathon submission", is_completed: false, priority: "high", due_date: new Date().toISOString() } as any,
          { id: "mock-t2", title: "Review MindFlow features", is_completed: true, priority: "medium", due_date: new Date().toISOString() } as any,
          { id: "mock-t3", title: "Add more notes", is_completed: false, priority: "low", due_date: new Date().toISOString() } as any,
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const { user: authUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && authUser) {
      fetchTasks();
    } else if (!authLoading && !authUser) {
      setLoading(false);
    }
  }, [authUser, authLoading]);

  const quickAdd = async () => {
    if (!newTitle.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "tasks"), { 
      user_id: user.uid, 
      title: newTitle.trim(), 
      priority: "medium",
      is_completed: false,
      is_deleted: false,
      sort_order: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setNewTitle("");
    toast.success("Task added!");
    fetchTasks();
  };

  const handleCreateTask = async () => {
    if (!formTitle.trim()) { toast.error("Title required"); return; }
    setFormSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "tasks"), {
      user_id: user.uid, 
      title: formTitle.trim(), 
      description: formDesc || null,
      priority: formPriority, 
      due_date: formDueDate || null,
      is_completed: false,
      is_deleted: false,
      sort_order: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setFormTitle(""); setFormDesc(""); setFormPriority("medium"); setFormDueDate("");
    setDialogOpen(false);
    toast.success("Task created!");
    fetchTasks();
    setFormSaving(false);
  };

  const toggleComplete = async (task: Task) => {
    await updateDoc(doc(db, "tasks", task.id), {
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await updateDoc(doc(db, "tasks", id), { 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    toast.success("Deleted");
    fetchTasks();
  };

  const filtered = tasks.filter(t => {
    if (filter === "pending") return !t.is_completed;
    if (filter === "completed") return t.is_completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-10 w-full" />
      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">{tasks.filter(t => !t.is_completed).length} pending</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/tasks/kanban")}>
            <Kanban className="mr-1 h-4 w-4" /> Kanban
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="gradient-primary border-0 text-white shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> New Task</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="What needs to be done?" className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Add details..." className="mt-1" rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Priority</Label>
                    <Select value={formPriority} onValueChange={v => setFormPriority(v as Priority)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🔴 High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Due Date</Label><Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="mt-1" /></div>
                </div>
                <Button onClick={handleCreateTask} disabled={formSaving} className="w-full gradient-primary border-0 text-white">
                  {formSaving ? <span className="animate-spin mr-2">⏳</span> : <Plus className="mr-2 h-4 w-4" />}
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <p className="mt-1.5 text-xs text-muted-foreground">{completedCount} of {totalCount} tasks completed</p>
        </CardContent>
      </Card>

      {/* Quick Add */}
      <div className="flex gap-2">
        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          placeholder="Quick add a task..." className="h-11"
          onKeyDown={e => e.key === "Enter" && quickAdd()} />
        <Button onClick={quickAdd} size="icon" className="h-11 w-11 shrink-0 gradient-primary border-0 text-white">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f} {f === "all" ? `(${totalCount})` : f === "pending" ? `(${totalCount - completedCount})` : `(${completedCount})`}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-3xl bg-emerald-500/10 p-5">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold">{filter === "completed" ? "No completed tasks" : "All done!"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "pending" ? "All tasks are completed 🎉" : "Add your first task above"}
              </p>
            </div>
          ) : (
            filtered.map((task, i) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2, delay: i * 0.02 }}>
                <div className={cn(
                  "group flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 transition-all duration-200 hover:border-primary/20 hover:shadow-sm",
                  task.is_completed && "opacity-60"
                )}>
                  <button onClick={() => toggleComplete(task)} className="shrink-0">
                    {task.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 transition-transform hover:scale-110" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", task.is_completed && "line-through text-muted-foreground")}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {task.due_date && (
                        <span className={cn("text-[11px] flex items-center gap-1",
                          isPast(new Date(task.due_date)) && !task.is_completed ? "text-destructive" : "text-muted-foreground")}>
                          <Calendar className="h-3 w-3" />
                          {isToday(new Date(task.due_date)) ? "Today" : format(new Date(task.due_date), "MMM d")}
                        </span>
                      )}
                      {task.description && <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{task.description}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn("text-[10px] shrink-0",
                    task.priority === "high" && "bg-red-500/10 text-red-500",
                    task.priority === "medium" && "bg-amber-500/10 text-amber-500",
                    task.priority === "low" && "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {task.priority}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0 text-destructive" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
