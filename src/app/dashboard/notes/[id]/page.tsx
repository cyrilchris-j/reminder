// ============================================
// MindFlow — Note Detail/Edit Page
// ============================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Tag, Palette, Sparkles, Trash2, Mic, MicOff, Download, FileText, FileJson, FileType, ListChecks, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { exportAsMarkdown, exportAsJSON, exportAsText, exportAsPrintableHTML } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteEditor } from "@/components/notes/note-editor";
import { createClient } from "@/lib/supabase/client";
import { NOTE_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Note } from "@/types/database";

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [plainText, setPlainText] = useState("");
  const [color, setColor] = useState("transparent");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showColors, setShowColors] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const voice = useVoiceInput();

  useEffect(() => {
    const fetchNote = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("notes")
        .select("*, note_tags(tag)")
        .eq("id", noteId)
        .single();
      if (data) {
        const n = { ...data, tags: (data.note_tags || []).map((t: {tag: string}) => t.tag) } as Note;
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setPlainText(n.plain_text);
        setColor(n.color);
        setTags(n.tags || []);
        setSummary(n.summary);
      }
      setLoading(false);
    };
    fetchNote();
  }, [noteId]);

  const handleContentChange = useCallback((json: Record<string, unknown>, text: string) => {
    setContent(json);
    setPlainText(text);
  }, []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("notes").update({ title, content, plain_text: plainText, color }).eq("id", noteId);
      // Update tags: delete all, re-insert
      await supabase.from("note_tags").delete().eq("note_id", noteId);
      if (tags.length > 0) await supabase.from("note_tags").insert(tags.map(tag => ({ note_id: noteId, tag })));
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSummarize = async () => {
    if (!plainText || plainText.length < 50) { toast.error("Note is too short to summarize"); return; }
    setSummarizing(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        const supabase = createClient();
        await supabase.from("notes").update({ summary: data.summary }).eq("id", noteId);
        toast.success("Summary generated!");
      }
    } catch {
      toast.error("AI summarize failed. Check your API key.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleExtractActions = async () => {
    if (!plainText || plainText.length < 20) { toast.error("Note is too short"); return; }
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/extract-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText }),
      });
      const data = await res.json();
      if (data.actions && data.actions.length > 0) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Create tasks
        const tasksToInsert = data.actions.map((t: string) => ({
          title: t,
          user_id: user.id,
          priority: "medium",
          description: `Extracted from note: ${title}`
        }));
        
        await supabase.from("tasks").insert(tasksToInsert);
        toast.success(`Extracted ${data.actions.length} tasks!`);
        router.push("/dashboard/tasks");
      } else {
        toast.info("No actionable tasks found in this note.");
      }
    } catch {
      toast.error("Failed to extract tasks.");
    } finally {
      setExtracting(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );

  if (!note) return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-lg font-semibold">Note not found</h2>
      <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/notes")}>Go back</Button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/notes")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Notes
        </Button>
        <div className="flex items-center gap-2">
          {/* Voice Input */}
          {voice.isSupported && (
            <Button variant={voice.isListening ? "destructive" : "outline"} size="icon" className="h-9 w-9" onClick={voice.toggleListening} title="Voice input">
              {voice.isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          {/* AI Features Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button disabled={summarizing || extracting} className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 hover:bg-primary/10 transition-colors text-sm font-medium text-primary">
                {(summarizing || extracting) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                AI Actions
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSummarize}>
                <Sparkles className="mr-2 h-4 w-4" /> Summarize Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExtractActions}>
                <ListChecks className="mr-2 h-4 w-4" /> Extract Tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAsMarkdown(title, plainText, tags)}>
                <FileText className="mr-2 h-4 w-4" /> Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAsJSON(title, content, plainText, tags, note?.created_at || '', note?.updated_at || '')}>
                <FileJson className="mr-2 h-4 w-4" /> JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAsText(title, plainText)}>
                <FileType className="mr-2 h-4 w-4" /> Plain Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAsPrintableHTML(title, plainText, tags)}>
                <Download className="mr-2 h-4 w-4" /> HTML (Print)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Color */}
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setShowColors(!showColors)}>
            <Palette className="h-4 w-4" style={{ color: color !== "transparent" ? color : undefined }} />
          </Button>
          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {showColors && (
        <div className="flex gap-2 flex-wrap">
          {NOTE_COLORS.map(c => (
            <button key={c.value} className={cn("h-8 w-8 rounded-full border-2 transition-all", color === c.value ? "border-primary scale-110" : "border-transparent hover:scale-105")}
              style={{ backgroundColor: c.value === "transparent" ? "var(--background)" : c.value }}
              onClick={() => setColor(c.value)} title={c.name} />
          ))}
        </div>
      )}

      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." className="border-0 text-2xl font-bold h-auto py-2 px-0 focus-visible:ring-0 bg-transparent" />

      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="h-4 w-4 text-muted-foreground" />
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))}>{tag} ×</Badge>
        ))}
        <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Add tag..." className="border-0 w-24 h-7 text-xs px-1 focus-visible:ring-0 bg-transparent" />
      </div>

      <p className="text-[11px] text-muted-foreground">Updated {format(new Date(note.updated_at), "MMM d, yyyy 'at' h:mm a")}</p>

      {/* AI Summary */}
      {summary && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">AI Summary</span>
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{summary}</p>
        </motion.div>
      )}

      {/* Voice transcript */}
      {voice.isListening && voice.transcript && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-600">Listening...</span>
          </div>
          <p className="text-sm text-foreground/80">{voice.transcript}</p>
        </motion.div>
      )}

      <div className="rounded-xl border border-border/50 bg-card/50 p-4 md:p-6 min-h-[400px]">
        <NoteEditor content={content} onChange={handleContentChange} />
      </div>
    </motion.div>
  );
}
