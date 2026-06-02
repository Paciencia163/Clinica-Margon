import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Sub-folder under the user's UUID. Use a stable id so admin uploads for a doctor don't collide. */
  folder?: string;
  fallback?: string;
  /** When true, file is placed under `admin/<folder>/...` (allowed only for admins via storage policy). */
  asAdmin?: boolean;
}

export const PhotoUpload = ({ value, onChange, folder = "profile", fallback = "?", asAdmin = false }: Props) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem não pode exceder 5 MB");
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Sessão expirou"); return; }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${folder}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success("Foto carregada");
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 ring-2 ring-border">
        <AvatarImage src={value ?? undefined} />
        <AvatarFallback className="gradient-primary text-primary-foreground font-semibold text-lg">{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {value ? "Trocar foto" : "Carregar foto"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" /> Remover
          </Button>
        )}
      </div>
    </div>
  );
};
