import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Stethoscope, User, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const LoginSelector = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  useEffect(() => { if (user) nav("/dashboard"); }, [user, nav]);

  return (
    <div className="min-h-screen gradient-soft flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shadow-card">
          <Stethoscope className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-2xl">Margon</span>
      </Link>

      <button onClick={() => nav("/")} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-8 transition-smooth">
        <ArrowLeft className="h-3 w-3" /> Voltar ao início
      </button>

      <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-center">Quem está a entrar?</h1>
      <p className="text-muted-foreground mb-10 text-center max-w-md">Escolha o seu tipo de acesso. Pacientes podem criar uma conta nova; médicos usam credenciais fornecidas pela clínica.</p>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Card
          onClick={() => nav("/login/paciente")}
          className="p-8 cursor-pointer hover:shadow-elegant hover:-translate-y-1 transition-smooth group border-2 hover:border-primary"
        >
          <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-card">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Sou Paciente</h2>
          <p className="text-sm text-muted-foreground mb-5">Marque consultas, veja o seu histórico e gerencie o seu perfil.</p>
          <span className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            Entrar ou criar conta <ArrowRight className="h-4 w-4" />
          </span>
        </Card>

        <Card
          onClick={() => nav("/login/medico")}
          className="p-8 cursor-pointer hover:shadow-elegant hover:-translate-y-1 transition-smooth group border-2 hover:border-secondary"
        >
          <div className="h-14 w-14 rounded-xl gradient-accent flex items-center justify-center mb-4 shadow-card">
            <Stethoscope className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Sou Médico</h2>
          <p className="text-sm text-muted-foreground mb-5">Aceda à sua agenda, consultas e disponibilidade.</p>
          <span className="text-secondary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            Entrar como médico <ArrowRight className="h-4 w-4" />
          </span>
        </Card>
      </div>

      <p className="mt-10 text-xs text-muted-foreground flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" /> Ambiente seguro · dados protegidos
      </p>
    </div>
  );
};

export default LoginSelector;
