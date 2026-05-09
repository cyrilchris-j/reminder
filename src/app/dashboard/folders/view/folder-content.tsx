"use client";
// ============================================
// MindFlow — Folder Detail Page (notes in folder)
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Note, Folder } from "@/types/database";
import { format } from "date-fns";
import { db, auth } from "@/lib/firebase/client";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export default function FolderDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("id") as string;
  const [user] = useAuthState(auth);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        // Fetch folder info
        const folderDoc = await getDoc(doc(db, "folders", folderId));
        if (folderDoc.exists()) {
          setFolder({ id: folderDoc.id, ...folderDoc.data() } as Folder);
        }

        // Fetch user notes and filter client-side (No index required)
        const notesRef = collection(db, "notes");
        const q = query(notesRef, where("user_id", "==", user.uid));
        const snapshot = await getDocs(q);
        const allNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        
        const filtered = allNotes
          .filter(n => n.folder_id === folderId && !n.is_deleted)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          
        setNotes(filtered);
      } catch (error) {
        console.error("Error fetching folder data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [folderId, user]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="relative pb-20">
      {/* Action Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/folders")} className="h-10 w-10 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{folder?.name || "Folder"}</h1>
          <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 && "s"}</p>
        </div>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-20"><div className="mb-4 rounded-3xl bg-primary/10 p-5"><StickyNote className="h-10 w-10 text-primary" /></div><p className="font-semibold">No notes in this folder</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map(note => (
            <Card key={note.id} className="cursor-pointer border-border/50 p-4 hover:shadow-md transition-all" onClick={() => router.push(`/dashboard/notes/view?id=${note.id}`)}>
              <h3 className="font-semibold text-sm truncate">{note.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{note.plain_text?.slice(0, 120)}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">{format(new Date(note.updated_at), "MMM d")}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
