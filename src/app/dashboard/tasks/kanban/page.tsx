// ============================================
// MindFlow — Kanban Board View for Tasks
// ============================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";

const columns = [
  { id: "todo", label: "To Do", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "inprogress", label: "In Progress", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "done", label: "Done", color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export default function KanbanPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_deleted", false)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const getColumnTasks = (colId: string) => {
    if (colId === "done") return tasks.filter(t => t.is_completed);
    if (colId === "inprogress") return tasks.filter(t => !t.is_completed && t.due_date && isToday(new Date(t.due_date)));
    // todo: not completed and not in-progress
    return tasks.filter(t => !t.is_completed && (!t.due_date || !isToday(new Date(t.due_date))));
  };

  const toggleComplete = async (task: Task) => {
    const supabase = createClient();
    await supabase.from("tasks").update({
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : null,
    }).eq("id", task.id);
    fetchTasks();
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/tasks")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> List View
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {columns.map((col) => {
          const colTasks = getColumnTasks(col.id);
          return (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", col.bg.replace("/10", ""))} style={{ backgroundColor: col.color === "text-blue-500" ? "#3b82f6" : col.color === "text-amber-500" ? "#f59e0b" : "#22c55e" }} />
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <Badge variant="secondary" className="text-[10px] h-5">{colTasks.length}</Badge>
                </div>
              </div>

              <div className="space-y-2 min-h-[200px] rounded-xl border border-dashed border-border/50 p-2 bg-muted/20">
                {colTasks.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="cursor-pointer border-border/50 transition-all hover:shadow-md hover:-translate-y-0.5">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <button onClick={() => toggleComplete(task)} className="mt-0.5 shrink-0">
                              {task.is_completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", task.is_completed && "line-through text-muted-foreground")}>
                                {task.title}
                              </p>
                              {task.due_date && (
                                <p className={cn("text-[11px] mt-1 flex items-center gap-1",
                                  isPast(new Date(task.due_date)) && !task.is_completed ? "text-destructive" : "text-muted-foreground")}>
                                  <Clock className="h-3 w-3" />
                                  {isToday(new Date(task.due_date)) ? "Today" : format(new Date(task.due_date), "MMM d")}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge variant="secondary" className={cn("text-[9px] px-1 py-0",
                                  task.priority === "high" && "bg-red-500/10 text-red-500",
                                  task.priority === "medium" && "bg-amber-500/10 text-amber-500",
                                  task.priority === "low" && "bg-emerald-500/10 text-emerald-500"
                                )}>
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
