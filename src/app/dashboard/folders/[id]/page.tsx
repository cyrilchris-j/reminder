// ============================================
// MindFlow — Folder Detail Page (notes in folder)
// ============================================
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Note, Folder } from "@/types/database";
import { format } from "date-fns";

export default function FolderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params.id as string;
  const [folder, setFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: f } = await supabase.from("folders").select("*").eq("id", folderId).single();
      setFolder(f as Folder);
      const { data: n } = await supabase.from("notes").select("*").eq("folder_id", folderId).eq("is_deleted", false).order("updated_at", { ascending: false });
      setNotes((n as Note[]) || []);
      setLoading(false);
    };
    fetch();
  }, [folderId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/folders")}><ArrowLeft className="mr-1 h-4 w-4" />Folders</Button>
        <h1 className="text-2xl font-bold">{folder?.name || "Folder"}</h1>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-20"><div className="mb-4 rounded-3xl bg-primary/10 p-5"><StickyNote className="h-10 w-10 text-primary" /></div><p className="font-semibold">No notes in this folder</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map(note => (
            <Card key={note.id} className="cursor-pointer border-border/50 p-4 hover:shadow-md transition-all" onClick={() => router.push(`/dashboard/notes/${note.id}`)}>
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
