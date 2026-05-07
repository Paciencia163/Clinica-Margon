import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setHasRecovery(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mínimo 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-soft p-6">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <h1 className="font-display text-2xl font-bold mb-2">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground mb-6">Escolha uma senha forte para a sua conta.</p>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="pw">Nova senha</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !hasRecovery}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Atualizar senha
          </Button>
          {!hasRecovery && <p className="text-xs text-muted-foreground text-center">Aguardando link de recuperação válido…</p>}
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
