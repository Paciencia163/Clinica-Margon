import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Check, X, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [avail, setAvail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: "09:00", end_time: "12:00", slot_minutes: 30 });

  const load = async () => {
    if (!user) return;
    const { data: doc } = await supabase.from("doctors").select("id").eq("user_id", user.id).maybeSingle();
    if (!doc) { setLoading(false); return; }
    setDoctorId(doc.id);
    const [{ data: a }, { data: av }] = await Promise.all([
      supabase.from("appointments").select("*, profiles!appointments_patient_id_fkey(full_name, phone)").eq("doctor_id", doc.id).order("appointment_date").order("appointment_time"),
      supabase.from("availability").select("*").eq("doctor_id", doc.id).order("day_of_week").order("start_time"),
    ]);
    setAppts(a ?? []);
    setAvail(av ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const setStatus = async (id: string, status: "pendente" | "confirmada" | "realizada" | "cancelada") => {
    const patch: any = { status };
    if (status === "cancelada") {
      const reason = window.prompt("Motivo do cancelamento:");
      if (reason === null) return;
      if (!reason.trim()) return toast.error("Informe o motivo do cancelamento.");
      patch.cancellation_reason = reason.trim();
      patch.cancelled_by = user?.id ?? null;
      patch.cancelled_at = new Date().toISOString();
    }
    const { error } = await supabase.from("appointments").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const addSlot = async () => {
    if (!doctorId) return;
    if (newSlot.start_time >= newSlot.end_time) {
      return toast.error("A hora de início deve ser anterior à hora de fim.");
    }
    const conflict = avail.find(
      (s) =>
        s.day_of_week === newSlot.day_of_week &&
        s.start_time < newSlot.end_time &&
        s.end_time > newSlot.start_time,
    );
    if (conflict) {
      return toast.error(`Conflito com o bloco ${conflict.start_time.slice(0,5)}–${conflict.end_time.slice(0,5)} (${DAYS[conflict.day_of_week]}).`);
    }
    const { error } = await supabase.from("availability").insert({ ...newSlot, doctor_id: doctorId });
    if (error) return toast.error(error.message);
    toast.success("Disponibilidade adicionada");
    load();
  };

  const delSlot = async (id: string) => {
    await supabase.from("availability").delete().eq("id", id);
    load();
  };

  if (loading) return <DashboardLayout title="Painel Médico"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></DashboardLayout>;

  if (!doctorId) {
    return (
      <DashboardLayout title="Painel Médico">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">A sua conta ainda não está associada a um perfil de médico.</p>
          <p className="text-sm text-muted-foreground mt-2">Contacte o administrador.</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Painel Médico" subtitle="Gerencie a sua agenda e consultas">
      <Tabs defaultValue="agenda">
        <TabsList>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-3 mt-6">
          {appts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Sem consultas marcadas.</Card>
          ) : appts.map((a) => (
            <Card key={a.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{a.profiles?.full_name ?? "Paciente"}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(a.appointment_date), "PPP", { locale: pt })} às {a.appointment_time.slice(0, 5)}
                  {a.profiles?.phone && ` · ${a.profiles.phone}`}
                </p>
                {a.status === "cancelada" && a.cancellation_reason && <p className="text-xs text-destructive mt-1">Motivo: {a.cancellation_reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{a.status}</Badge>
                {a.status !== "realizada" && a.status !== "cancelada" && (
                  <>
                    <Button size="sm" variant="soft" onClick={() => setStatus(a.id, "confirmada")}>Confirmar</Button>
                    <Button size="sm" variant="hero" onClick={() => setStatus(a.id, "realizada")}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, "cancelada")}><X className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="disponibilidade" className="space-y-4 mt-6">
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-4">Adicionar bloco semanal</h3>
            <div className="grid sm:grid-cols-5 gap-3 items-end">
              <div>
                <Label>Dia</Label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" value={newSlot.day_of_week} onChange={(e) => setNewSlot({ ...newSlot, day_of_week: +e.target.value })}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div><Label>Início</Label><Input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} /></div>
              <div><Label>Duração (min)</Label><Input type="number" value={newSlot.slot_minutes} onChange={(e) => setNewSlot({ ...newSlot, slot_minutes: +e.target.value })} /></div>
              <Button variant="hero" onClick={addSlot}><Plus className="h-4 w-4" /> Adicionar</Button>
            </div>
          </Card>

          <div className="space-y-2">
            {avail.length === 0 ? <Card className="p-8 text-center text-muted-foreground">Sem disponibilidade definida.</Card> : avail.map((s) => (
              <Card key={s.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{DAYS[s.day_of_week]}</Badge>
                  <span className="text-sm">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} ({s.slot_minutes} min/consulta)</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => delSlot(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
