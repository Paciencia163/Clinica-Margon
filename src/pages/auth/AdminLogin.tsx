import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, Loader2, ArrowLeft, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) nav("/dashboard"); }, [user, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = schema.safeParse(form);
      if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
      if (error) throw error;
      // Validate admin role
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", signIn.user!.id);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Esta conta não tem permissões de administrador.");
        return;
      }
      toast.success("Bem-vindo, administrador!");
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Algo correu mal");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-soft flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center shadow-card">
          <ShieldCheck className="h-5 w-5 text-background" />
        </div>
        <span className="font-display font-bold text-2xl">Área Reservada</span>
      </Link>

      <Card className="w-full max-w-md p-8 shadow-elegant border-foreground/20">
        <button onClick={() => nav("/auth")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-smooth">
          <ArrowLeft className="h-3 w-3" /> Trocar tipo de acesso
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-5 w-5 text-foreground" />
          <h1 className="font-display text-2xl font-bold">Entrar como administrador</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Acesso restrito à equipa da clínica</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>

          <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
