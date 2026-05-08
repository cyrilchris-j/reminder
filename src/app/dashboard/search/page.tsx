// ============================================
// MindFlow — Search Page
// ============================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, StickyNote, CheckSquare, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Note, Task } from "@/types/database";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setNotes([]); setTasks([]); setSearched(false); return; }
    setSearched(true);
    const supabase = createClient();
    const term = `%${q}%`;
    const { data: n } = await supabase.from("notes").select("*").eq("is_deleted", false).or(`title.ilike.${term},plain_text.ilike.${term}`).order("updated_at", { ascending: false }).limit(20);
    const { data: t } = await supabase.from("tasks").select("*").eq("is_deleted", false).or(`title.ilike.${term},description.ilike.${term}`).order("created_at", { ascending: false }).limit(20);
    setNotes((n as Note[]) || []);
    setTasks((t as Task[]) || []);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={e => handleSearch(e.target.value)} placeholder="Search notes, tasks, and more..."
          className="h-12 pl-12 text-base rounded-xl" autoFocus />
      </div>

      {!searched ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Type to search across all your notes and tasks</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notes.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><StickyNote className="h-3 w-3" />Notes ({notes.length})</h2>
              <div className="space-y-2">
                {notes.map(n => (
                  <Card key={n.id} className="cursor-pointer border-border/50 hover:border-primary/20 transition-all" onClick={() => router.push(`/dashboard/notes/${n.id}`)}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-violet-500/10 p-2"><StickyNote className="h-4 w-4 text-violet-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.plain_text?.slice(0, 100)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {tasks.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CheckSquare className="h-3 w-3" />Tasks ({tasks.length})</h2>
              <div className="space-y-2">
                {tasks.map(t => (
                  <Card key={t.id} className="cursor-pointer border-border/50 hover:border-primary/20 transition-all" onClick={() => router.push("/dashboard/tasks")}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-emerald-500/10 p-2"><CheckSquare className="h-4 w-4 text-emerald-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", t.is_completed && "line-through text-muted-foreground")}>{t.title}</p>
                        <p className="text-[11px] text-muted-foreground">{t.due_date ? format(new Date(t.due_date), "MMM d") : "No due date"}</p>
                      </div>
                      <Badge variant="secondary" className={cn("text-[10px]", t.priority === "high" && "bg-red-500/10 text-red-500")}>{t.priority}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {notes.length === 0 && tasks.length === 0 && (
            <div className="flex flex-col items-center py-16"><p className="text-muted-foreground">No results for &ldquo;{query}&rdquo;</p></div>
          )}
        </div>
      )}
    </div>
  );
}
