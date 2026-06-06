import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Loader2, CalendarIcon, X } from "lucide-react";
import { format, getDay } from "date-fns";
import { pt } from "date-fns/locale";

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  years_experience: number | null;
  photo_url: string | null;
  consultation_price: number | null;
}

interface Slot {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

const countSlots = (s: Slot) => {
  const [h1, m1] = s.start_time.split(":").map(Number);
  const [h2, m2] = s.end_time.split(":").map(Number);
  const mins = h2 * 60 + m2 - (h1 * 60 + m1);
  return Math.max(0, Math.floor(mins / s.slot_minutes));
};

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availability, setAvailability] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<{ doctor_id: string; appointment_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("all");
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const [{ data: docs }, { data: av }] = await Promise.all([
        supabase.from("doctors").select("*").eq("active", true).order("full_name"),
        supabase.from("availability").select("doctor_id, day_of_week, start_time, end_time, slot_minutes"),
      ]);
      setDoctors((docs ?? []) as Doctor[]);
      setAvailability((av ?? []) as Slot[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!date) { setAppointments([]); return; }
    const day = format(date, "yyyy-MM-dd");
    supabase
      .from("appointments")
      .select("doctor_id, appointment_time")
      .eq("appointment_date", day)
      .neq("status", "cancelada")
      .then(({ data }) => setAppointments(data ?? []));
  }, [date]);

  const availableDoctorIds = useMemo(() => {
    if (!date) {
      return new Set(availability.map((a) => a.doctor_id));
    }
    const dow = getDay(date);
    const todays = availability.filter((a) => a.day_of_week === dow);
    const taken = new Map<string, Set<string>>();
    appointments.forEach((ap) => {
      const set = taken.get(ap.doctor_id) ?? new Set();
      set.add(ap.appointment_time.slice(0, 5));
      taken.set(ap.doctor_id, set);
    });
    const free = new Set<string>();
    const byDoc = new Map<string, Slot[]>();
    todays.forEach((s) => {
      const list = byDoc.get(s.doctor_id) ?? [];
      list.push(s);
      byDoc.set(s.doctor_id, list);
    });
    byDoc.forEach((slots, docId) => {
      const takenSet = taken.get(docId) ?? new Set();
      let totalSlots = 0;
      let busy = 0;
      slots.forEach((s) => {
        totalSlots += countSlots(s);
        const [h1, m1] = s.start_time.split(":").map(Number);
        const [h2, m2] = s.end_time.split(":").map(Number);
        let cur = h1 * 60 + m1;
        const end = h2 * 60 + m2;
        while (cur + s.slot_minutes <= end) {
          const hh = String(Math.floor(cur / 60)).padStart(2, "0");
          const mm = String(cur % 60).padStart(2, "0");
          if (takenSet.has(`${hh}:${mm}`)) busy++;
          cur += s.slot_minutes;
        }
      });
      if (totalSlots > busy) free.add(docId);
    });
    return free;
  }, [date, availability, appointments]);

  const visibleDoctors = doctors.filter((d) => availableDoctorIds.has(d.id));
  const specialties = Array.from(new Set(visibleDoctors.map((d) => d.specialty)));
  const filtered = visibleDoctors.filter(
    (d) =>
      (spec === "all" || d.specialty === spec) &&
      (d.full_name.toLowerCase().includes(q.toLowerCase()) ||
        d.specialty.toLowerCase().includes(q.toLowerCase()))
  );

  const dayHasAvailability = date
    ? availability.some((a) => a.day_of_week === getDay(date))
    : true;

  // Suggest next dates (within 30 days) that have at least one availability
  const suggestedDates = useMemo(() => {
    if (!date) return [];
    const have = new Set(availability.map((a) => a.day_of_week));
    const start = new Date(date);
    const out: Date[] = [];
    for (let i = 1; i <= 30 && out.length < 3; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (have.has(d.getDay())) out.push(d);
    }
    return out;
  }, [date, availability]);

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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 justify-start gap-2 md:w-64">
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "PPP", { locale: pt }) : "Filtrar por data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={pt}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {date && (
              <Button variant="ghost" size="icon" className="h-12 w-12" onClick={() => setDate(undefined)} aria-label="Limpar data">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            {date && !dayHasAvailability ? (
              <>
                <p className="font-medium">Nenhum médico atende em {format(date, "PPP", { locale: pt })}.</p>
                <p className="text-sm text-muted-foreground mt-2">Não existem disponibilidades cadastradas para este dia da semana.</p>
              </>
            ) : date ? (
              <>
                <p className="font-medium">Todos os horários estão preenchidos em {format(date, "PPP", { locale: pt })}.</p>
                <p className="text-sm text-muted-foreground mt-2">Não há médicos com vagas livres nesta data.</p>
              </>
            ) : doctors.length === 0 ? (
              <>
                <p className="font-medium">Nenhum médico encontrado.</p>
                <p className="text-sm text-muted-foreground mt-2">Os médicos ainda não foram cadastrados pelo administrador.</p>
              </>
            ) : visibleDoctors.length === 0 ? (
              <>
                <p className="font-medium">Sem disponibilidades cadastradas.</p>
                <p className="text-sm text-muted-foreground mt-2">Os médicos ainda não definiram os seus horários de atendimento.</p>
              </>
            ) : (
              <>
                <p className="font-medium">Nenhum médico corresponde à pesquisa.</p>
                <p className="text-sm text-muted-foreground mt-2">Ajuste o nome ou a especialidade e tente novamente.</p>
              </>
            )}

            {date && suggestedDates.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <p className="text-sm font-medium mb-3">Datas alternativas com médicos disponíveis:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedDates.map((d) => (
                    <Button key={d.toISOString()} size="sm" variant="soft" onClick={() => setDate(d)}>
                      <CalendarIcon className="h-3 w-3" /> {format(d, "EEE, dd 'de' MMM", { locale: pt })}
                    </Button>
                  ))}
                </div>
                <Button variant="link" size="sm" className="mt-3" onClick={() => setDate(undefined)}>
                  Ver todas as disponibilidades futuras →
                </Button>
              </div>
            )}
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
