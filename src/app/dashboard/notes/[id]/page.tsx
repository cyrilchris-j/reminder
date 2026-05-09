"use client";

import { db, auth } from "@/lib/firebase/client";
import { collection, getDoc, doc, addDoc, updateDoc } from "firebase/firestore";
// ============================================
// MindFlow — Note Detail/Edit Page
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Tag, Palette, Sparkles, Mic, MicOff, Download, FileText, FileJson, FileType, ListChecks, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { exportAsMarkdown, exportAsJSON, exportAsText, exportAsPrintableHTML } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NoteEditor } from "@/components/notes/note-editor";
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
      const docRef = doc(db, "notes", noteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        const n = { id: docSnap.id, ...data } as Note;
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setPlainText(n.plain_text);
        setColor(n.color);
        setTags(n.tags || []);
        setSummary(n.summary || null);
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
      await updateDoc(doc(db, "notes", noteId), { 
        title, 
        content, 
        plain_text: plainText, 
        color,
        tags,
        updated_at: new Date().toISOString()
      });
      toast.success("Saved!");
    } catch (error) {
      console.error(error);
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
        await updateDoc(doc(db, "notes", noteId), { 
          summary: data.summary,
          updated_at: new Date().toISOString()
        });
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
        const user = auth.currentUser;
        if (!user) return;
        
        // Create tasks sequentially (or could use writeBatch)
        for (const t of data.actions) {
          await addDoc(collection(db, "tasks"), {
            title: t,
            user_id: user.uid,
            priority: "medium",
            description: `Extracted from note: ${title}`,
            is_completed: false,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative pb-24">
      {/* Fixed Header for Actions */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-2xl border-b border-border/50 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/5 md:relative md:top-auto md:left-auto md:right-auto md:z-30 md:-mx-4 md:mb-6 md:rounded-none md:border-b-0 md:bg-transparent md:backdrop-blur-none md:shadow-none">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/notes")} className="h-10 w-10 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* AI Feature Pill (Mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button disabled={summarizing || extracting} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95">
                {(summarizing || extracting) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </button>
            } />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-primary/10">
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/60">AI Intelligence</p>
              <DropdownMenuItem onClick={handleSummarize} className="rounded-xl py-2.5">
                <Sparkles className="mr-3 h-4 w-4 text-primary" /> Summarize Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExtractActions} className="rounded-xl py-2.5">
                <ListChecks className="mr-3 h-4 w-4 text-emerald-500" /> Extract To-Do List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Secondary Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-all active:scale-95">
                <Palette className="h-4 w-4 text-foreground/70" />
              </button>
            } />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-3 shadow-2xl border-border/50">
               <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Appearance</p>
               <div className="grid grid-cols-4 gap-2 px-1 mb-4">
                  {NOTE_COLORS.map(c => (
                    <button key={c.value} className={cn("h-8 w-8 rounded-full border-2 transition-all", color === c.value ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-transparent")}
                      style={{ backgroundColor: c.value === "transparent" ? "var(--muted)" : c.value }}
                      onClick={() => setColor(c.value)} />
                  ))}
               </div>
               <Separator className="my-2" />
               <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Tools</p>
               {voice.isSupported && (
                 <DropdownMenuItem onClick={voice.toggleListening} className="rounded-xl py-2.5">
                   <Mic className={cn("mr-3 h-4 w-4", voice.isListening && "text-red-500 animate-pulse")} /> 
                   {voice.isListening ? "Stop Voice Input" : "Start Voice Input"}
                 </DropdownMenuItem>
               )}
               <DropdownMenuItem onClick={() => exportAsMarkdown(title, plainText, tags)} className="rounded-xl py-2.5">
                 <Download className="mr-3 h-4 w-4" /> Export as Markdown
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Save Button */}
          <Button onClick={handleSave} disabled={saving} className="h-10 px-6 rounded-2xl gradient-primary border-0 text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 font-bold text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {/* Top Spacer for Fixed Header on Mobile */}
      <div className="h-16 md:hidden" />

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
