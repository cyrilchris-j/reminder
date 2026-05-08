// ============================================
// MindFlow — New Note Page
// ============================================
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Tag, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NoteEditor } from "@/components/notes/note-editor";
import { createClient } from "@/lib/supabase/client";
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const { data: note, error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, title: title || "Untitled", content, plain_text: plainText, color })
        .select()
        .single();

      if (error) throw error;

      // Insert tags
      if (tags.length > 0 && note) {
        await supabase.from("note_tags").insert(tags.map(tag => ({ note_id: note.id, tag })));
      }

      toast.success("Note saved!");
      router.push(`/dashboard/notes/${note.id}`);
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setShowColors(!showColors)}>
            <Palette className="h-4 w-4" style={{ color: color !== "transparent" ? color : undefined }} />
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white shadow-md shadow-primary/20">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

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
