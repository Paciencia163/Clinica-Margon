import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, Award, Clock, Coins, ArrowLeft, Building2, Globe, CalendarDays } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { formatAOA } from "@/lib/format";

interface Experience { name: string; url?: string | null; description?: string | null; }
interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  years_experience: number | null;
  photo_url: string | null;
  consultation_price: number | null;
  experiences: Experience[] | null;
}
interface Slot { day_of_week: number; start_time: string; end_time: string; slot_minutes: number; }

const DoctorProfile = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Slot[]>([]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [pendingTime, setPendingTime] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: d } = await supabase.from("doctors").select("*").eq("id", id).maybeSingle();
      setDoctor(d as any);
      const { data: av } = await supabase.from("availability").select("*").eq("doctor_id", id);
      setAvailability(av ?? []);
    })();
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    const day = format(date, "yyyy-MM-dd");
    const refresh = () => supabase.from("appointments")
      .select("appointment_time")
      .eq("doctor_id", id)
      .eq("appointment_date", day)
      .neq("status", "cancelada")
      .then(({ data }) => setTaken(new Set((data ?? []).map((a) => a.appointment_time.slice(0, 5)))));
    refresh();
    // Real-time: react to any new/changed booking for this doctor on this date
    const channel = supabase
      .channel(`appts-${id}-${day}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${id}` }, (payload: any) => {
        const row = (payload.new ?? payload.old) as any;
        if (row?.appointment_date === day) refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, date]);

  const generateSlots = (): string[] => {
    if (!date) return [];
    const dow = getDay(date);
    const slots = availability.filter((a) => a.day_of_week === dow);
    const out: string[] = [];
    for (const s of slots) {
      const [h1, m1] = s.start_time.split(":").map(Number);
      const [h2, m2] = s.end_time.split(":").map(Number);
      let cur = h1 * 60 + m1;
      const end = h2 * 60 + m2;
      while (cur + s.slot_minutes <= end) {
        const hh = String(Math.floor(cur / 60)).padStart(2, "0");
        const mm = String(cur % 60).padStart(2, "0");
        out.push(`${hh}:${mm}`);
        cur += s.slot_minutes;
      }
    }
    return out;
  };

  const book = async (time: string) => {
    if (!user) { nav("/auth"); return; }
    if (!date || !id) return;
    setSubmitting(true);
    const day = format(date, "yyyy-MM-dd");
    // Real-time re-check right before insert
    const { data: latest } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", id)
      .eq("appointment_date", day)
      .neq("status", "cancelada");
    const latestTaken = new Set((latest ?? []).map((a) => a.appointment_time.slice(0, 5)));
    if (latestTaken.has(time)) {
      setTaken(latestTaken);
      setSubmitting(false);
      toast.error("Este horário acabou de ser reservado por outro paciente. Escolha outro.");
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: id,
      appointment_date: day,
      appointment_time: `${time}:00`,
      status: "pendente",
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setTaken((prev) => new Set(prev).add(time));
        toast.error("Horário já reservado. A lista foi atualizada.");
      } else toast.error(error.message);
      return;
    }
    toast.success(
      doctor?.consultation_price
        ? `Consulta marcada com sucesso! Valor: ${formatAOA(doctor.consultation_price)}`
        : "Consulta marcada com sucesso!"
    );
    setTaken((prev) => new Set(prev).add(time));
    setPendingTime(null);
  };

  if (!doctor) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const slots = generateSlots();
  const defaultExperiences: Experience[] = [
    { name: "Hospital Central do Lubango", url: "https://www.google.com/maps?q=Hospital+Central+do+Lubango", description: "Referência hospitalar da Huíla" },
    { name: "Cristo Rei — Lubango", url: "https://www.google.com/maps?q=Cristo+Rei+Lubango", description: "Atendimento na zona do Cristo Rei" },
    { name: "Universidade Mandume Ya Ndemufayo", url: "https://www.umn.ed.ao", description: "Formação académica e investigação" },
  ];
  const experiences: Experience[] = (doctor.experiences && doctor.experiences.length > 0) ? doctor.experiences : defaultExperiences;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container py-10 flex-1">
        <button onClick={() => nav(-1)} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-6 transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 p-6 h-fit shadow-card">
            <Avatar className="h-32 w-32 mx-auto ring-4 ring-accent/20">
              <AvatarImage src={doctor.photo_url ?? undefined} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-bold">
                {doctor.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <h1 className="font-display text-2xl font-bold text-center mt-4">{doctor.full_name}</h1>
            <Badge variant="secondary" className="mx-auto block w-fit mt-2">{doctor.specialty}</Badge>

            <div className="mt-6 space-y-3 text-sm">
              {doctor.years_experience ? (
                <div className="flex items-center gap-3"><Award className="h-4 w-4 text-secondary" /> {doctor.years_experience} anos de experiência</div>
              ) : null}
              {doctor.consultation_price ? (
                <div className="flex items-center gap-3"><Coins className="h-4 w-4 text-secondary" /> {formatAOA(doctor.consultation_price)} / consulta</div>
              ) : null}
              <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-secondary" /> Consulta de 30 min</div>
            </div>

            {doctor.bio && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <h3 className="font-semibold mb-2 text-sm">Sobre</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border/40">
              <h3 className="font-semibold mb-3 text-sm">Experiência e instituições</h3>
              <ul className="space-y-3 text-sm">
                {experiences.map((exp, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                    <div>
                      {exp.url ? (
                        <a href={exp.url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary transition-smooth">{exp.name}</a>
                      ) : (
                        <span className="font-medium">{exp.name}</span>
                      )}
                      {exp.description && <p className="text-xs text-muted-foreground">{exp.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6 shadow-card">
            <h2 className="font-display text-xl font-bold mb-4">Marcar consulta</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-3">1. Escolha a data</p>
                <div className="rounded-lg border border-border bg-card">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={pt}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">2. Escolha o horário {date && <span className="text-muted-foreground">— {format(date, "PPP", { locale: pt })}</span>}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Fuso horário: <span className="font-medium">Africa/Luanda (GMT+1)</span>
                  {availability[0]?.slot_minutes ? ` • Duração ${availability[0].slot_minutes} min` : ""}
                  {doctor.consultation_price ? <> • Valor <span className="font-medium text-foreground">{formatAOA(doctor.consultation_price)}</span></> : null}
                  {slots.length > 0 && <> • <span className="text-secondary font-medium">{slots.filter((s) => !taken.has(s)).length} livres</span> de {slots.length}</>}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">Sem horários disponíveis para este dia.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const busy = taken.has(s);
                      const dur = availability[0]?.slot_minutes ?? 30;
                      const priceTxt = doctor.consultation_price ? ` • ${formatAOA(doctor.consultation_price)}` : "";
                      return (
                        <Button key={s} variant={busy ? "outline" : "soft"} size="sm" disabled={busy || submitting} onClick={() => { if (!user) { nav("/auth"); return; } setPendingTime(s); }} className={busy ? "opacity-40 line-through" : ""} title={busy ? "Indisponível" : `Reservar ${s} (${dur} min${priceTxt})`}>
                          {s}
                        </Button>
                      );
                    })}
                  </div>
                )}
                {!user && <p className="text-xs text-muted-foreground mt-4">Precisa de <a href="/auth" className="text-primary underline">iniciar sessão</a> para marcar.</p>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!pendingTime} onOpenChange={(o) => { if (!o) setPendingTime(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar marcação</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-foreground">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={doctor.photo_url ?? undefined} />
                    <AvatarFallback>{doctor.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{doctor.full_name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-secondary" /> {date && format(date, "PPP", { locale: pt })} às <span className="font-semibold">{pendingTime}</span></div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-secondary" /> Duração: <span className="font-medium">{availability[0]?.slot_minutes ?? 30} min</span></div>
                  <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-secondary" /> Valor: <span className="font-medium">{doctor.consultation_price ? formatAOA(doctor.consultation_price) : "A combinar"}</span></div>
                  <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-secondary" /> Fuso horário: <span className="font-medium">Africa/Luanda (GMT+1)</span></div>
                </div>
                <p className="text-xs text-muted-foreground">Reveja os dados antes de confirmar. A marcação ficará pendente de validação.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={(e) => { e.preventDefault(); if (pendingTime) book(pendingTime); }}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />A confirmar...</> : "Confirmar marcação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Footer />
    </div>
  );
};

export default DoctorProfile;
