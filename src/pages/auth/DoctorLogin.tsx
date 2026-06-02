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
import { Stethoscope, Loader2, ArrowLeft, Info } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const DoctorLogin = () => {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) nav("/dashboard"); }, [user, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const parsed = schema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) throw error;
        toast.success("Bem-vindo, doutor(a)!");
        nav("/dashboard");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Email de recuperação enviado!");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Algo correu mal");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-soft flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shadow-card">
          <Stethoscope className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-2xl">Área Médica</span>
      </Link>

      <Card className="w-full max-w-md p-8 shadow-elegant border-secondary/30">
        <button onClick={() => nav("/auth")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-smooth">
          <ArrowLeft className="h-3 w-3" /> Trocar tipo de acesso
        </button>

        <h1 className="font-display text-2xl font-bold mb-1">{mode === "login" ? "Entrar como médico" : "Recuperar senha"}</h1>
        <p className="text-sm text-muted-foreground mb-6">{mode === "login" ? "Aceda à sua agenda e consultas" : "Enviaremos um link para o seu email"}</p>

        <div className="bg-muted/50 border border-border/40 rounded-md p-3 text-xs text-muted-foreground flex items-start gap-2 mb-6">
          <Info className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
          <p>As credenciais médicas são criadas pelo administrador da clínica. Se ainda não tem acesso, contacte a recepção da Clínica Margon.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label htmlFor="email">Email profissional</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          {mode === "login" && <div><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>}

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Enviar email"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === "login" ? (
            <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-smooth">Esqueci a minha senha</button>
          ) : (
            <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Voltar a entrar</button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DoctorLogin;
