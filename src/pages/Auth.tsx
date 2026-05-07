import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Stethoscope, Loader2, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});
const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Nome obrigatório").max(100),
  phone: z.string().trim().max(20).optional(),
});

const Auth = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) nav("/dashboard");
  }, [user, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
        nav("/dashboard");
      } else if (mode === "login") {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        nav("/dashboard");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email de recuperação enviado!");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Algo correu mal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-soft flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shadow-card">
          <Stethoscope className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-2xl">Margon</span>
      </Link>

      <Card className="w-full max-w-md p-8 shadow-elegant">
        <button onClick={() => nav("/")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-smooth">
          <ArrowLeft className="h-3 w-3" /> Voltar ao início
        </button>

        <h1 className="font-display text-2xl font-bold mb-1">
          {mode === "login" && "Entrar"}
          {mode === "signup" && "Criar conta"}
          {mode === "forgot" && "Recuperar senha"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "login" && "Acesse a sua área pessoal"}
          {mode === "signup" && "Comece em menos de um minuto"}
          {mode === "forgot" && "Enviaremos um link para o seu email"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          )}
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" && "Entrar"}
            {mode === "signup" && "Criar conta"}
            {mode === "forgot" && "Enviar email"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-smooth block w-full">
                Esqueci a minha senha
              </button>
              <p className="text-muted-foreground">
                Sem conta? <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">Registar</button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-muted-foreground">
              Já tem conta? <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button>
            </p>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Voltar a entrar</button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
