"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
// ============================================
// MindFlow — Notes List Page
// ============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Grid3X3, List, StickyNote, Pin, Archive,
  Trash2, MoreHorizontal, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchNotes = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const notesRef = collection(db, "notes");
      const q = query(
        notesRef,
        where("user_id", "==", user.uid),
        where("is_deleted", "==", false),
        where("is_archived", "==", false),
        orderBy("is_pinned", "desc"),
        orderBy("updated_at", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes((data as Note[]) || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      
      // HACKATHON FALLBACK
      if (error instanceof Error && error.message.includes("permission")) {
        setNotes([
          { id: "demo-1", title: "Project Brainstorming", plain_text: "Need to finalize the hackathon project ideas. Focus on AI features.", updated_at: new Date().toISOString(), tags: ["work", "priority"], is_pinned: true, color: "#bae6fd" } as any,
          { id: "demo-2", title: "Shopping List", plain_text: "Milk, Bread, Eggs, Avocados.", updated_at: new Date().toISOString(), tags: ["personal"], is_pinned: false, color: "#fef08a" } as any,
          { id: "demo-3", title: "Design Inspiration", plain_text: "Check out Dribbble and Awwwards for modern layouts.", updated_at: new Date().toISOString(), tags: ["design"], is_pinned: false, color: "#d9f99d" } as any,
        ]);
        toast.error("Using offline mode due to permission errors.");
      } else {
        toast.error("Failed to load notes.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchNotes();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (id: string, action: string, pinned?: boolean) => {
    if (action === "pin") {
      await updateDoc(doc(db, "notes", id), { is_pinned: !pinned, updated_at: new Date().toISOString() });
      toast.success(pinned ? "Unpinned" : "Pinned");
    } else if (action === "archive") {
      await updateDoc(doc(db, "notes", id), { is_archived: true, updated_at: new Date().toISOString() });
      toast.success("Archived");
    } else if (action === "delete") {
      await updateDoc(doc(db, "notes", id), { 
        is_deleted: true, 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      toast.success("Moved to trash");
    }
    fetchNotes();
  };

  const filtered = notes.filter(n => {
    const s = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.plain_text?.toLowerCase().includes(search.toLowerCase());
    const t = !selectedTag || n.tags?.includes(selectedTag);
    return s && t;
  });
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));
  const pinnedNotes = filtered.filter(n => n.is_pinned);
  const regularNotes = filtered.filter(n => !n.is_pinned);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 && "s"}</p>
        </div>
        <Button className="gradient-primary border-0 text-white shadow-md shadow-primary/20" onClick={() => router.push("/dashboard/notes/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10" />
        </div>
        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-10"><Tag className="mr-1 h-3.5 w-3.5" />{selectedTag || "Tags"}</Button>} />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedTag(null)}>All</DropdownMenuItem>
                {allTags.map(tag => <DropdownMenuItem key={tag} onClick={() => setSelectedTag(tag)}>{tag}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="flex rounded-lg border">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-r-none" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-l-none" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-3xl bg-primary/10 p-5"><StickyNote className="h-10 w-10 text-primary" /></div>
          <h2 className="text-lg font-semibold">{search ? "No notes found" : "No notes yet"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{search ? "Try different keywords" : "Start capturing your ideas"}</p>
          {!search && <Button className="mt-4 gradient-primary border-0 text-white" onClick={() => router.push("/dashboard/notes/new")}><Plus className="mr-2 h-4 w-4" />Create first note</Button>}
        </div>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Pin className="h-3 w-3" />Pinned</h2>
              <NoteCards notes={pinnedNotes} viewMode={viewMode} onAction={handleAction} router={router} />
            </div>
          )}
          {regularNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Others</h2>}
              <NoteCards notes={regularNotes} viewMode={viewMode} onAction={handleAction} router={router} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteCards({ notes, viewMode, onAction, router }: {
  notes: Note[]; viewMode: string;
  onAction: (id: string, action: string, pinned?: boolean) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className={cn(viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3")}>
      <AnimatePresence mode="popLayout">
        {notes.map((note, i) => (
          <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
            <Card className="group relative cursor-pointer border-border/50 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
              style={{ borderLeftColor: note.color !== "transparent" && note.color !== "#ffffff" ? note.color : undefined, borderLeftWidth: note.color !== "transparent" && note.color !== "#ffffff" ? 3 : undefined }}
              onClick={() => router.push(`/dashboard/notes/${note.id}`)}>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate pr-8">{note.title || "Untitled"}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">{note.plain_text?.slice(0, 150) || "Empty note"}</p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {note.tags?.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
                  <span className="text-[10px] text-muted-foreground/60">{format(new Date(note.updated_at), "MMM d")}</span>
                </div>
                {note.is_pinned && <Pin className="absolute top-3 right-3 h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm"><MoreHorizontal className="h-4 w-4" /></Button>} onClick={e => e.stopPropagation()} />
                  <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onAction(note.id, "pin", note.is_pinned)}><Pin className="mr-2 h-4 w-4" />{note.is_pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction(note.id, "archive")}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction(note.id, "delete")} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
