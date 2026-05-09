"use client";
// ============================================
// MindFlow — Note Editor Component (TipTap)
// ============================================

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, List, ListOrdered, ListChecks,
  Highlighter, Code, Quote, Undo2, Redo2, Minus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  content: Record<string, unknown>;
  onChange: (json: Record<string, unknown>, text: string) => void;
  editable?: boolean;
}

export function NoteEditor({ content, onChange, editable = true }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your note..." }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>, editor.getText());
    },
    editorProps: {
      attributes: { class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-1" },
    },
  });

  if (!editor) return null;

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), tooltip: "Bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), tooltip: "Italic" },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), tooltip: "Underline" },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), tooltip: "Strikethrough" },
    "sep",
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), tooltip: "Heading 1" },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), tooltip: "Heading 2" },
    "sep",
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), tooltip: "Bullet List" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), tooltip: "Numbered List" },
    { icon: ListChecks, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive("taskList"), tooltip: "Task List" },
    "sep",
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive("highlight"), tooltip: "Highlight" },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock"), tooltip: "Code Block" },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), tooltip: "Quote" },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, tooltip: "Divider" },
    "sep",
    { icon: Undo2, action: () => editor.chain().focus().undo().run(), active: false, tooltip: "Undo" },
    { icon: Redo2, action: () => editor.chain().focus().redo().run(), active: false, tooltip: "Redo" },
  ];

  return (
    <div className="tiptap-editor">
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-muted/30 p-1.5 mb-4 sticky top-0 z-10 backdrop-blur-sm">
          {tools.map((tool, i) => {
            if (tool === "sep") return <Separator key={i} orientation="vertical" className="h-6 mx-1" />;
            const t = tool as { icon: React.ElementType; action: () => void; active: boolean; tooltip: string };
            return (
              <Tooltip key={i}>
                <TooltipTrigger render={
                  <button className={cn("h-8 w-8 rounded-lg inline-flex items-center justify-center hover:bg-accent transition-colors", t.active && "bg-primary/10 text-primary")} onClick={t.action}>
                    <t.icon className="h-4 w-4" />
                  </button>
                } />
                <TooltipContent>{t.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
