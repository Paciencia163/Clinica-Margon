import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Loader2 } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  years_experience: number | null;
  photo_url: string | null;
  consultation_price: number | null;
}

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("all");

  useEffect(() => {
    supabase
      .from("doctors")
      .select("*")
      .eq("active", true)
      .order("full_name")
      .then(({ data }) => {
        setDoctors(data ?? []);
        setLoading(false);
      });
  }, []);

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty)));
  const filtered = doctors.filter(
    (d) =>
      (spec === "all" || d.specialty === spec) &&
      (d.full_name.toLowerCase().includes(q.toLowerCase()) ||
        d.specialty.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="gradient-hero text-primary-foreground py-16">
        <div className="container">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Os nossos médicos</h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">Especialistas certificados, prontos para o atender.</p>
        </div>
      </section>

      <section className="container py-12 flex-1">
        <Card className="p-4 mb-8 -mt-12 relative shadow-elegant">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por nome ou especialidade…" className="pl-10 h-12" />
            </div>
            <select value={spec} onChange={(e) => setSpec(e.target.value)} className="h-12 px-4 rounded-md border border-input bg-background text-sm">
              <option value="all">Todas as especialidades</option>
              {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum médico encontrado.</p>
            <p className="text-sm text-muted-foreground mt-2">Os médicos ainda não foram cadastrados pelo administrador.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <Card key={d.id} className="p-6 hover:shadow-elegant transition-smooth hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-accent/30">
                    <AvatarImage src={d.photo_url ?? undefined} />
                    <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                      {d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-lg leading-tight">{d.full_name}</h3>
                    <Badge variant="secondary" className="mt-1">{d.specialty}</Badge>
                  </div>
                </div>
                {d.bio && <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{d.bio}</p>}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/40">
                  <div className="text-xs text-muted-foreground">
                    {d.years_experience ? `${d.years_experience} anos exp.` : "Especialista"}
                  </div>
                  <Button asChild variant="soft" size="sm">
                    <Link to={`/medicos/${d.id}`}>Ver perfil <ArrowRight className="h-3 w-3" /></Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Doctors;
