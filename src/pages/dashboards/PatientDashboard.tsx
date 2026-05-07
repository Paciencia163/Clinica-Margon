import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, X, Loader2, Stethoscope } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Link } from "react-router-dom";
import { formatAOA } from "@/lib/format";

interface Appt {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  doctors: { full_name: string; specialty: string; consultation_price: number | null } | null;
}

const statusColor: Record<string, string> = {
  pendente: "bg-warning/15 text-warning-foreground border-warning/40",
  confirmada: "bg-secondary/15 text-secondary border-secondary/40",
  realizada: "bg-success/15 text-success border-success/40",
  cancelada: "bg-destructive/15 text-destructive border-destructive/40",
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*, doctors(full_name, specialty, consultation_price)")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    setAppts((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelada" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Consulta cancelada");
    load();
  };

  const upcoming = appts.filter((a) => a.status !== "cancelada" && a.status !== "realizada" && new Date(a.appointment_date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const history = appts.filter((a) => !upcoming.includes(a));

  return (
    <DashboardLayout title="As minhas consultas" subtitle="Gerencie as suas marcações e histórico">
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5"><p className="text-sm text-muted-foreground">Próximas</p><p className="text-3xl font-display font-bold mt-1">{upcoming.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Realizadas</p><p className="text-3xl font-display font-bold mt-1">{appts.filter((a) => a.status === "realizada").length}</p></Card>
        <Card className="p-5 gradient-primary text-primary-foreground">
          <p className="text-sm opacity-80">Marcar nova</p>
          <Button asChild variant="accent" size="sm" className="mt-2"><Link to="/medicos">Pesquisar médicos <Stethoscope className="h-4 w-4" /></Link></Button>
        </Card>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> : (
        <>
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-secondary" /> Próximas consultas</h2>
          {upcoming.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground mb-8">Nenhuma consulta agendada.</Card>
          ) : (
            <div className="space-y-3 mb-10">
              {upcoming.map((a) => <ApptRow key={a.id} a={a} onCancel={cancel} />)}
            </div>
          )}

          <h2 className="font-display text-xl font-bold mb-4">Histórico</h2>
          {history.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Sem histórico ainda.</Card>
          ) : (
            <div className="space-y-3">
              {history.map((a) => <ApptRow key={a.id} a={a} onCancel={cancel} />)}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );

  function ApptRow({ a, onCancel }: { a: Appt; onCancel: (id: string) => void }) {
    const isUpcoming = a.status === "pendente" || a.status === "confirmada";
    return (
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4 hover:shadow-card transition-smooth">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center text-primary-foreground font-display font-bold">
            {format(parseISO(a.appointment_date), "dd")}
          </div>
          <div>
            <p className="font-semibold">{a.doctors?.full_name ?? "Médico"}</p>
            <p className="text-sm text-muted-foreground">{a.doctors?.specialty} · {format(parseISO(a.appointment_date), "PPP", { locale: pt })} às {a.appointment_time.slice(0, 5)}{a.doctors?.consultation_price ? ` · ${formatAOA(a.doctors.consultation_price)}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor[a.status]}>{a.status}</Badge>
          {isUpcoming && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(a.id)}><X className="h-4 w-4" /> Cancelar</Button>
          )}
        </div>
      </Card>
    );
  }
};

export default PatientDashboard;
