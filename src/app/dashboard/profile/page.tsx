// ============================================
// MindFlow — Profile Page
// ============================================
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Camera, Moon, Sun, Monitor, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.full_name || user.user_metadata?.full_name || "");
        setAvatarUrl(profile.avatar_url || "");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, avatar_url: avatarUrl, theme: theme || "system" });
    toast.success("Profile updated!");
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const themes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      {/* Avatar */}
      <Card className="border-border/50">
        <CardContent className="flex items-center gap-6 p-6">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full gradient-primary text-white shadow-lg hover:scale-110 transition-transform">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{fullName || "User"}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
            {uploading && <p className="text-xs text-primary mt-1 animate-pulse">Uploading...</p>}
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" /></div>
          <div><Label>Email</Label><Input value={email} disabled className="mt-1 bg-muted/50" /></div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {themes.map(t => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 flex-1 transition-all",
                  theme === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                <t.icon className={cn("h-6 w-6", theme === t.value ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary border-0 text-white shadow-md shadow-primary/20">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </motion.div>
  );
}
