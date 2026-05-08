// ============================================
// MindFlow — Folders Page
// ============================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { FOLDER_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Folder } from "@/types/database";
import { toast } from "sonner";

export default function FoldersPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(FOLDER_COLORS[0]);

  const fetchFolders = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("folders").select("*").order("sort_order");
    setFolders((data as Folder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchFolders(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("folders").insert({ user_id: user.id, name: name.trim(), color });
    setName(""); setDialogOpen(false);
    toast.success("Folder created!");
    fetchFolders();
  };

  const deleteFolder = async (id: string) => {
    const supabase = createClient();
    await supabase.from("folders").delete().eq("id", id);
    toast.success("Folder deleted");
    fetchFolders();
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Folders</h1>
          <p className="text-sm text-muted-foreground">{folders.length} folder{folders.length !== 1 && "s"}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger >
            <Button className="gradient-primary border-0 text-white shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" />New Folder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Folder name" className="mt-1" /></div>
              <div><Label>Color</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {FOLDER_COLORS.map(c => (
                    <button key={c} className={cn("h-8 w-8 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105")} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full gradient-primary border-0 text-white"><FolderOpen className="mr-2 h-4 w-4" />Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 rounded-3xl bg-primary/10 p-5"><FolderOpen className="h-10 w-10 text-primary" /></div>
          <h2 className="text-lg font-semibold">No folders yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Organize your notes into folders</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder, i) => (
            <motion.div key={folder.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group cursor-pointer border-border/50 transition-all hover:shadow-md hover:-translate-y-0.5" onClick={() => router.push(`/dashboard/folders/${folder.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl p-2.5" style={{ backgroundColor: folder.color + "20" }}>
                      <FolderOpen className="h-6 w-6" style={{ color: folder.color }} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger  onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent onClick={e => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="mt-3 font-semibold">{folder.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(folder.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
