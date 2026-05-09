"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, addDoc } from "firebase/firestore";
// ============================================
// MindFlow — New Note Page
// ============================================

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Tag, Palette } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NoteEditor } from "@/components/notes/note-editor";
import { NOTE_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [plainText, setPlainText] = useState("");
  const [color, setColor] = useState("transparent");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const handleContentChange = useCallback((json: Record<string, unknown>, text: string) => {
    setContent(json);
    setPlainText(text);
  }, []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !plainText.trim()) {
      toast.error("Note is empty");
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) { 
        toast.error("Not authenticated"); 
        setSaving(false);
        return; 
      }

      const docRef = await addDoc(collection(db, "notes"), {
        user_id: user.uid,
        title: title || "Untitled",
        content,
        plain_text: plainText,
        color,
        tags,
        is_pinned: false,
        is_archived: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      toast.success("Note saved!");
      router.push(`/dashboard/notes/view?id=${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative pb-24">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-2xl border-b border-border/50 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/5 md:relative md:top-auto md:left-auto md:right-auto md:z-30 md:-mx-4 md:mb-6 md:rounded-none md:border-b-0 md:bg-transparent md:backdrop-blur-none md:shadow-none">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-all active:scale-95">
                <Palette className="h-4 w-4 text-foreground/70" />
              </button>
            } />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-3 shadow-2xl border-border/50">
               <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Note Color</p>
               <div className="grid grid-cols-4 gap-2 px-1">
                  {NOTE_COLORS.map(c => (
                    <button key={c.value} className={cn("h-8 w-8 rounded-full border-2 transition-all", color === c.value ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-transparent")}
                      style={{ backgroundColor: c.value === "transparent" ? "var(--muted)" : c.value }}
                      onClick={() => setColor(c.value)} />
                  ))}
               </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleSave} disabled={saving} className="h-10 px-6 rounded-2xl gradient-primary border-0 text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 font-bold text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {/* Top Spacer for Fixed Header on Mobile */}
      <div className="h-16 md:hidden" />

      {/* Color picker */}
      {showColors && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-2 flex-wrap">
          {NOTE_COLORS.map(c => (
            <button key={c.value} className={cn("h-8 w-8 rounded-full border-2 transition-all", color === c.value ? "border-primary scale-110" : "border-transparent hover:scale-105")}
              style={{ backgroundColor: c.value === "transparent" ? "var(--background)" : c.value }}
              onClick={() => setColor(c.value)} title={c.name} />
          ))}
        </motion.div>
      )}

      {/* Title */}
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." className="border-0 text-2xl font-bold h-auto py-2 px-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40" />

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="h-4 w-4 text-muted-foreground" />
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))}>
            {tag} ×
          </Badge>
        ))}
        <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Add tag..." className="border-0 w-24 h-7 text-xs px-1 focus-visible:ring-0 bg-transparent" />
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 md:p-6 min-h-[400px]">
        <NoteEditor content={content} onChange={handleContentChange} />
      </div>
    </motion.div>
  );
}
