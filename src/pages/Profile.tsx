import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, User, Mail, MapPin, Shield, Camera, KeyRound } from "lucide-react";

const Profile = () => {
  const { user, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [changingPwd, setChangingPwd] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    endereco: "",
    cidade: "Lubango",
    provincia: "Huíla",
    bi: "",
    data_nascimento: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          endereco: (data as any).endereco ?? "",
          cidade: (data as any).cidade ?? "Lubango",
          provincia: (data as any).provincia ?? "Huíla",
          bi: (data as any).bi ?? "",
          data_nascimento: (data as any).data_nascimento ?? "",
        });
        const path = (data as any).avatar_url as string | null;
        if (path) {
          setAvatarPath(path);
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
          if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Máximo 5MB.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      // remove old
      if (avatarPath) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setAvatarPath(path);
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar foto");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const changePassword = async () => {
    if (!user?.email) return;
    if (pwd.next.length < 8) return toast.error("A nova senha deve ter pelo menos 8 caracteres.");
    if (pwd.next !== pwd.confirm) return toast.error("As senhas não coincidem.");
    setChangingPwd(true);
    try {
      // Validate current password by attempting a sign-in
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwd.current,
      });
      if (signErr) {
        toast.error("Senha atual incorreta.");
        return;
      }
      const { error: updErr } = await supabase.auth.updateUser({ password: pwd.next });
      if (updErr) throw updErr;
      setPwd({ current: "", next: "", confirm: "" });
      toast.success("Senha alterada com sucesso!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao alterar senha");
    } finally {
      setChangingPwd(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        provincia: form.provincia || null,
        bi: form.bi || null,
        data_nascimento: form.data_nascimento || null,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado!");
  };

  if (loading) {
    return (
      <DashboardLayout title="O meu perfil">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="O meu perfil" subtitle="Gerencie os seus dados pessoais e de contacto">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-display font-bold shadow-glow overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  form.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("") || <User className="h-10 w-10" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elegant hover:bg-primary/90 transition-smooth disabled:opacity-50"
                aria-label="Alterar foto"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <h2 className="font-display text-xl font-bold mt-4">{form.full_name || "Sem nome"}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Mail className="h-3 w-3" /> {user?.email}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="capitalize">
                  <Shield className="h-3 w-3 mr-1" />{r}
                </Badge>
              ))}
            </div>
            {form.endereco && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {form.cidade}, {form.provincia}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-display text-lg font-bold">Dados pessoais</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 …" />
            </div>
            <div>
              <Label>Bilhete de Identidade</Label>
              <Input value={form.bi} onChange={(e) => setForm({ ...form, bi: e.target.value })} placeholder="000000000LA000" />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>
          </div>

          <h3 className="font-display text-lg font-bold pt-4">Endereço</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Endereço (rua, bairro, nº)</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Bairro …, Rua …" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label>Província</Label>
              <Input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="hero" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar alterações
            </Button>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Alterar senha</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Por segurança, confirme a sua senha atual antes de definir uma nova.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Senha atual</Label>
              <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} autoComplete="current-password" />
            </div>
            <div>
              <Label>Nova senha</Label>
              <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} autoComplete="new-password" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={changePassword} disabled={changingPwd || !pwd.current || !pwd.next || !pwd.confirm}>
              {changingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
