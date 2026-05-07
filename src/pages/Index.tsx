import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Shield, Clock, Heart, Brain, Baby, Stethoscope, Eye, Bone, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-doctor.jpg";

const specialties = [
  { icon: Heart, name: "Cardiologia", desc: "Saúde do coração" },
  { icon: Brain, name: "Neurologia", desc: "Sistema nervoso" },
  { icon: Baby, name: "Pediatria", desc: "Cuidado infantil" },
  { icon: Eye, name: "Oftalmologia", desc: "Visão e olhos" },
  { icon: Bone, name: "Ortopedia", desc: "Ossos e articulações" },
  { icon: Stethoscope, name: "Clínica Geral", desc: "Medicina familiar" },
];

const features = [
  { icon: Calendar, title: "Agenda online 24/7", desc: "Marque consultas a qualquer hora, sem telefonemas." },
  { icon: Shield, title: "Dados protegidos", desc: "Encriptação ponta-a-ponta e privacidade médica." },
  { icon: Clock, title: "Lembretes automáticos", desc: "Nunca mais perca uma consulta importante." },
  { icon: Sparkles, title: "Médicos verificados", desc: "Profissionais com registo e experiência confirmados." },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-secondary/40 blur-3xl animate-float" />
          <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        </div>
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-28">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur px-4 py-1.5 text-xs font-medium uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Clínica Margon
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-balance mb-6">
              Cuidar da sua saúde nunca foi tão simples.
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-xl mb-8 leading-relaxed">
              Marque consultas online com os melhores especialistas. Sem filas, sem espera, sem complicações — apenas cuidado dedicado.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent" size="xl">
                <Link to="/medicos">Marcar consulta <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/auth?mode=signup">Criar conta grátis</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-primary-foreground/80">
              {["+50 especialistas", "+10.000 pacientes", "4.9★ satisfação"].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />{s}
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in-up">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img src={heroImg} alt="Médica da Clínica Margon" width={1536} height={1024} className="w-full h-auto" />
            </div>
            <Card className="absolute -bottom-6 -left-4 md:-left-8 p-4 shadow-elegant max-w-[220px] bg-card animate-float">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div className="text-foreground">
                  <p className="text-xs text-muted-foreground">Consulta marcada</p>
                  <p className="text-sm font-semibold">Amanhã às 10:00</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Uma plataforma pensada para si</h2>
          <p className="text-muted-foreground text-lg">Tudo o que precisa para cuidar da sua saúde, num só lugar.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="p-6 hover:shadow-elegant transition-smooth hover:-translate-y-1 border-border/60">
              <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center mb-4 shadow-card">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section id="especialidades" className="gradient-soft py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">Especialidades</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Cuidado em todas as áreas</h2>
            </div>
            <Button asChild variant="soft">
              <Link to="/medicos">Ver todos os médicos <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((s) => (
              <Card key={s.name} className="p-5 text-center hover:shadow-elegant hover:-translate-y-1 transition-smooth cursor-pointer group">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/5 group-hover:gradient-primary group-hover:text-primary-foreground transition-smooth flex items-center justify-center mb-3">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display font-semibold text-sm">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="gradient-primary text-primary-foreground p-10 md:p-16 text-center shadow-elegant overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-64 w-64 bg-secondary/40 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-balance">
              Pronto para cuidar de si?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
              Crie a sua conta gratuita e marque a primeira consulta em menos de 2 minutos.
            </p>
            <Button asChild variant="accent" size="xl">
              <Link to="/auth?mode=signup">Começar agora <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
