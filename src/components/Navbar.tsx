import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, LayoutDashboard, User } from "lucide-react";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-card group-hover:shadow-glow transition-smooth">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg">Margon</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Clínica</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-foreground/80 hover:text-primary transition-smooth">Início</Link>
          <Link to="/medicos" className="text-foreground/80 hover:text-primary transition-smooth">Médicos</Link>
          <Link to="/#especialidades" className="text-foreground/80 hover:text-primary transition-smooth">Especialidades</Link>
          <Link to="/localizacoes" className="text-foreground/80 hover:text-primary transition-smooth">Localizações</Link>
          <Link to="/contactos" className="text-foreground/80 hover:text-primary transition-smooth">Contactos</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")}>
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Painel</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => nav("/perfil")}>
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); nav("/"); }}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav("/auth")}>Entrar</Button>
              <Button variant="hero" size="sm" onClick={() => nav("/auth?mode=signup")}>Criar conta</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
