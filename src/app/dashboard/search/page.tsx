"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
// ============================================
// MindFlow — Search Page
// ============================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, StickyNote, CheckSquare, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Note, Task } from "@/types/database";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setNotes([]); setTasks([]); setSearched(false); return; }
    setSearched(true);
    
    const user = auth.currentUser;
    if (!user) return;

    // Firestore doesn't support full-text search or ilike easily.
    // For this app, we'll fetch all non-deleted items and filter client-side.
    // In a real large-scale app, we'd use Algolia or ElasticSearch.

    const notesRef = collection(db, "notes");
    const notesSnapshot = await getDocs(query(notesRef, where("user_id", "==", user.uid), where("is_deleted", "==", false)));
    const allNotes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
    const filteredNotes = allNotes.filter(n => 
      n.title.toLowerCase().includes(q.toLowerCase()) || 
      n.plain_text?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 20);

    const tasksRef = collection(db, "tasks");
    const tasksSnapshot = await getDocs(query(tasksRef, where("user_id", "==", user.uid), where("is_deleted", "==", false)));
    const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    const filteredTasks = allTasks.filter(t => 
      t.title.toLowerCase().includes(q.toLowerCase()) || 
      t.description?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 20);

    setNotes(filteredNotes);
    setTasks(filteredTasks);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search notes, tasks, and more..."
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
            <div className="flex flex-col items-center py-16"><p className="text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p></div>
          )}
        </div>
      )}
    </div>
  );
}
