// ============================================
// MindFlow — Dashboard Home Page
// Shows welcome, today's tasks, recent notes, reminders
// ============================================
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  StickyNote,
  CheckSquare,
  Bell,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Note, Task, Reminder } from "@/types/database";
import { format, isToday } from "date-fns";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUserName(
        profile?.full_name || user.user_metadata?.full_name || "there"
      );

      // Get recent notes
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(6);

      setNotes((notesData as Note[]) || []);

      // Get today's tasks
      const today = new Date().toISOString().split("T")[0];
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true })
        .limit(10);

      setTasks((tasksData as Task[]) || []);

      // Get upcoming reminders
      const { data: remindersData } = await supabase
        .from("reminders")
        .select("*")
        .eq("is_active", true)
        .gte("remind_at", new Date().toISOString())
        .order("remind_at", { ascending: true })
        .limit(5);

      setReminders((remindersData as Reminder[]) || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Task completion stats
  const completedToday = tasks.filter(
    (t) => t.is_completed && t.completed_at && isToday(new Date(t.completed_at))
  ).length;
  const totalTodayTasks = tasks.filter(
    (t) => t.due_date && isToday(new Date(t.due_date))
  ).length;
  const completionPercent =
    totalTodayTasks > 0 ? Math.round((completedToday / totalTodayTasks) * 100) : 0;

  const todayTasks = tasks.filter(
    (t) => !t.is_completed && ((t.due_date && isToday(new Date(t.due_date))) || !t.due_date)
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Card */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-chart-2/5 to-chart-3/5">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {greeting},{" "}
                  <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                    {userName}
                  </span>
                  ! 👋
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-lg italic">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gradient-primary border-0 text-white shadow-md shadow-primary/20"
                  onClick={() => router.push("/dashboard/notes/new")}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Note
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/dashboard/tasks")}
                >
                  <CheckSquare className="mr-1 h-4 w-4" />
                  Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: StickyNote,
            label: "Total Notes",
            value: notes.length,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
          {
            icon: CheckSquare,
            label: "Tasks Pending",
            value: tasks.filter((t) => !t.is_completed).length,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            icon: Bell,
            label: "Reminders",
            value: reminders.length,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="group cursor-pointer border-border/50 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("rounded-xl p-2.5", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Progress */}
      {totalTodayTasks > 0 && (
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Today&apos;s Progress</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {completionPercent}%
                </span>
              </div>
              <Progress value={completionPercent} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {completedToday} of {totalTodayTasks} tasks completed
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                Today&apos;s Tasks
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => router.push("/dashboard/tasks")}
              >
                View all
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-2xl bg-emerald-500/10 p-3">
                    <CheckSquare className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No pending tasks. Enjoy your day!
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push("/dashboard/tasks")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add task
                  </Button>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        task.priority === "high" && "bg-red-500",
                        task.priority === "medium" && "bg-amber-500",
                        task.priority === "low" && "bg-emerald-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.due_date), "h:mm a")}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] capitalize",
                        task.priority === "high" && "bg-red-500/10 text-red-500",
                        task.priority === "medium" && "bg-amber-500/10 text-amber-500",
                        task.priority === "low" && "bg-emerald-500/10 text-emerald-500"
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Notes */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <StickyNote className="h-4 w-4 text-violet-500" />
                Recent Notes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => router.push("/dashboard/notes")}
              >
                View all
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-2xl bg-violet-500/10 p-3">
                    <StickyNote className="h-6 w-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium">No notes yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start capturing your thoughts!
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push("/dashboard/notes/new")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    New note
                  </Button>
                </div>
              ) : (
                notes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                    className="group cursor-pointer rounded-xl border border-transparent px-3 py-2.5 transition-all hover:bg-accent/50"
                    style={{
                      borderLeftColor: note.color !== "transparent" && note.color !== "#ffffff" ? note.color : undefined,
                      borderLeftWidth: note.color !== "transparent" && note.color !== "#ffffff" ? 3 : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{note.title}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {note.plain_text?.slice(0, 80) || "Empty note"}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {format(new Date(note.updated_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Reminders */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-4 w-4 text-amber-500" />
                Upcoming Reminders
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => router.push("/dashboard/reminders")}
              >
                View all
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-2xl bg-amber-500/10 p-3">
                    <Bell className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium">No reminders</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set reminders to stay on track
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors"
                    >
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <Bell className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{reminder.title}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(reminder.remind_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {reminder.repeat_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Feature Card */}
        <motion.div variants={item}>
          <Card className="group relative overflow-hidden border-border/50 cursor-pointer transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
            <CardContent className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl gradient-primary p-3 shadow-lg shadow-primary/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold">AI Assistant</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Summarize notes, extract tasks, get smart suggestions, and more — powered by AI.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/dashboard/notes/new")}
                  >
                    Try it now
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
