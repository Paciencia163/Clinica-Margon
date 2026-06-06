import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Users, Stethoscope, Calendar, MapPin, Clock, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { formatAOA } from "@/lib/format";
import { PhotoUpload } from "@/components/PhotoUpload";

interface Experience { name: string; url?: string; description?: string; }
interface AvailBlock { id?: string; day_of_week: number; start_time: string; end_time: string; slot_minutes: number; }
interface Doctor { id: string; full_name: string; specialty: string; bio: string | null; years_experience: number | null; photo_url: string | null; consultation_price: number | null; active: boolean; user_id: string | null; experiences?: Experience[] | null; }
interface Location { id: string; name: string; provincia: string; municipio: string; bairro: string | null; endereco: string; phone: string | null; whatsapp: string | null; email: string | null; maps_url: string | null; opening_hours: string | null; is_main: boolean; active: boolean; }
interface Specialty { id: string; name: string; description: string | null; active: boolean; }

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const PROVINCIAS = ["Huíla", "Luanda", "Benguela", "Huambo", "Namibe", "Cunene", "Cuando Cubango", "Bié", "Moxico", "Malanje", "Kwanza Sul", "Kwanza Norte", "Uíge", "Zaire", "Cabinda", "Lunda Norte", "Lunda Sul", "Bengo"];
const defaultAvail: AvailBlock[] = [
  { day_of_week: 1, start_time: "08:00", end_time: "12:00", slot_minutes: 30 },
  { day_of_week: 2, start_time: "08:00", end_time: "12:00", slot_minutes: 30 },
  { day_of_week: 3, start_time: "08:00", end_time: "12:00", slot_minutes: 30 },
  { day_of_week: 4, start_time: "08:00", end_time: "12:00", slot_minutes: 30 },
  { day_of_week: 5, start_time: "08:00", end_time: "12:00", slot_minutes: 30 },
];

const empty = {
  email: "", password: "", phone: "",
  bi: "", data_nascimento: "", provincia: "Huíla", cidade: "Lubango", endereco: "",
  full_name: "", specialty: "", bio: "", years_experience: 0, photo_url: "",
  consultation_price: 0, experiences: [] as Experience[], availability: defaultAvail,
};
const emptyLoc = { name: "", provincia: "Huíla", municipio: "Lubango", bairro: "", endereco: "", phone: "", whatsapp: "", email: "", maps_url: "", opening_hours: "", is_main: false };

const findAvailabilityConflict = (blocks: AvailBlock[], candidate: AvailBlock, ignoreIndex = -1) =>
  blocks.find((b, index) =>
    index !== ignoreIndex &&
    b.day_of_week === candidate.day_of_week &&
    b.start_time < candidate.end_time &&
    b.end_time > candidate.start_time,
  );

const AdminDashboard = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  // Availability management for existing doctors
  const [agendaDoctor, setAgendaDoctor] = useState<Doctor | null>(null);
  const [agendaBlocks, setAgendaBlocks] = useState<AvailBlock[]>([]);
  const [newBlock, setNewBlock] = useState<AvailBlock>({ day_of_week: 1, start_time: "09:00", end_time: "12:00", slot_minutes: 30 });

  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locDialog, setLocDialog] = useState(false);
  const [locForm, setLocForm] = useState(emptyLoc);

  const load = async () => {
    const [{ data: d }, { data: a }, { data: l }, { data: s }] = await Promise.all([
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*, doctors(full_name, specialty), profiles!appointments_patient_id_fkey(full_name)").order("appointment_date", { ascending: false }).limit(50),
      supabase.from("clinic_locations").select("*").order("is_main", { ascending: false }),
      (supabase as any).from("specialties").select("*").order("name"),
    ]);
    setDoctors((d as any) ?? []);
    setAppts(a ?? []);
    setLocations((l as any) ?? []);
    setSpecialties((s as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...empty, availability: defaultAvail.map((b) => ({ ...b })) }); setDialog(true); };
  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      email: "", password: "", phone: "",
      bi: "", data_nascimento: "", provincia: "Huíla", cidade: "Lubango", endereco: "",
      full_name: d.full_name, specialty: d.specialty, bio: d.bio ?? "",
      years_experience: d.years_experience ?? 0, photo_url: d.photo_url ?? "",
      consultation_price: Number(d.consultation_price ?? 0),
      experiences: (d.experiences as Experience[]) ?? [],
      availability: [],
    });
    setDialog(true);
  };

  const save = async () => {
    if (!form.full_name || !form.specialty) return toast.error("Nome e especialidade são obrigatórios");
    const invalidTime = form.availability.find((a) => a.start_time >= a.end_time);
    if (!editing && invalidTime) return toast.error("Cada horário deve ter início anterior ao fim");
    const conflict = !editing && form.availability.find((a, index) => findAvailabilityConflict(form.availability, a, index));
    if (conflict) return toast.error(`Conflito de horário em ${DAYS[conflict.day_of_week]} (${conflict.start_time}–${conflict.end_time})`);
    setSaving(true);
    try {
      if (editing) {
        const payload = {
          full_name: form.full_name, specialty: form.specialty, bio: form.bio || null,
          years_experience: form.years_experience, photo_url: form.photo_url || null,
          consultation_price: form.consultation_price,
          experiences: form.experiences.filter((e) => e.name?.trim()) as any,
        };
        const { error } = await supabase.from("doctors").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Médico atualizado");
      } else {
        if (!form.email || !form.password) { toast.error("Email e palavra-passe obrigatórios"); setSaving(false); return; }
        if (form.password.length < 8) { toast.error("Palavra-passe mínimo 8 caracteres"); setSaving(false); return; }
        const { data, error } = await supabase.functions.invoke("admin-create-doctor", {
          body: {
            email: form.email, password: form.password, phone: form.phone || null,
            bi: form.bi || null, data_nascimento: form.data_nascimento || null,
            provincia: form.provincia, cidade: form.cidade, endereco: form.endereco || null,
            full_name: form.full_name, specialty: form.specialty, bio: form.bio || null,
            years_experience: form.years_experience, photo_url: form.photo_url || null,
            consultation_price: form.consultation_price,
            experiences: form.experiences.filter((e) => e.name?.trim()),
            availability: form.availability.filter((a) => a.start_time && a.end_time),
          },
        });
        if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
        toast.success("Médico criado — pode entrar com as credenciais fornecidas");
      }
      setDialog(false);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao guardar");
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este médico?")) return;
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const toggleActive = async (d: Doctor) => {
    await supabase.from("doctors").update({ active: !d.active }).eq("id", d.id);
    load();
  };

  // ===== Agenda management =====
  const openAgenda = async (d: Doctor) => {
    setAgendaDoctor(d);
    const { data } = await supabase.from("availability").select("*").eq("doctor_id", d.id).order("day_of_week").order("start_time");
    setAgendaBlocks((data as any) ?? []);
  };
  const addBlock = async () => {
    if (!agendaDoctor) return;
    if (newBlock.start_time >= newBlock.end_time) return toast.error("A hora de início deve ser anterior à hora de fim.");
    const conflict = findAvailabilityConflict(agendaBlocks, newBlock);
    if (conflict) return toast.error(`Conflito com ${conflict.start_time.slice(0, 5)}–${conflict.end_time.slice(0, 5)} (${DAYS[conflict.day_of_week]}).`);
    const { error } = await supabase.from("availability").insert({ ...newBlock, doctor_id: agendaDoctor.id });
    if (error) return toast.error(error.message);
    toast.success("Bloco adicionado");
    openAgenda(agendaDoctor);
  };
  const removeBlock = async (id: string) => {
    await supabase.from("availability").delete().eq("id", id);
    if (agendaDoctor) openAgenda(agendaDoctor);
  };

  // ===== Locations =====
  const openNewLoc = () => { setEditingLoc(null); setLocForm(emptyLoc); setLocDialog(true); };
  const openEditLoc = (l: Location) => {
    setEditingLoc(l);
    setLocForm({ name: l.name, provincia: l.provincia, municipio: l.municipio, bairro: l.bairro ?? "", endereco: l.endereco, phone: l.phone ?? "", whatsapp: l.whatsapp ?? "", email: l.email ?? "", maps_url: l.maps_url ?? "", opening_hours: l.opening_hours ?? "", is_main: l.is_main });
    setLocDialog(true);
  };
  const saveLoc = async () => {
    if (!locForm.name || !locForm.endereco) return toast.error("Nome e endereço obrigatórios");
    const payload: any = { ...locForm, bairro: locForm.bairro || null, phone: locForm.phone || null, whatsapp: locForm.whatsapp || null, email: locForm.email || null, maps_url: locForm.maps_url || null, opening_hours: locForm.opening_hours || null };
    const { error } = editingLoc
      ? await supabase.from("clinic_locations").update(payload).eq("id", editingLoc.id)
      : await supabase.from("clinic_locations").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingLoc ? "Local atualizado" : "Local criado");
    setLocDialog(false); load();
  };
  const removeLoc = async (id: string) => {
    if (!confirm("Remover este local?")) return;
    const { error } = await supabase.from("clinic_locations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido"); load();
  };

  // ===== Specialties =====
  const addSpecialty = async () => {
    const name = newSpecialty.trim();
    if (!name) return;
    const { error } = await (supabase as any).from("specialties").insert({ name });
    if (error) return toast.error(error.message);
    setNewSpecialty("");
    load();
  };
  const toggleSpecialty = async (sp: Specialty) => {
    await (supabase as any).from("specialties").update({ active: !sp.active }).eq("id", sp.id);
    load();
  };
  const removeSpecialty = async (id: string) => {
    if (!confirm("Remover esta especialidade?")) return;
    await (supabase as any).from("specialties").delete().eq("id", id);
    load();
  };

  return (
    <DashboardLayout title="Administração" subtitle="Gerencie médicos, agenda, locais e consultas">
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 flex items-center gap-4"><Stethoscope className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Médicos</p><p className="text-2xl font-display font-bold">{doctors.length}</p></div></Card>
        <Card className="p-5 flex items-center gap-4"><Calendar className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Consultas</p><p className="text-2xl font-display font-bold">{appts.length}</p></div></Card>
        <Card className="p-5 flex items-center gap-4"><Users className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Ativas</p><p className="text-2xl font-display font-bold">{appts.filter((a) => a.status !== "cancelada").length}</p></div></Card>
        <Card className="p-5 flex items-center gap-4"><MapPin className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Locais</p><p className="text-2xl font-display font-bold">{locations.length}</p></div></Card>
      </div>

      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="specialties">Especialidades</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="mt-6 space-y-3">
          <div className="flex justify-end">
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild><Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> Novo médico</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editing ? "Editar médico" : "Novo médico (com acesso)"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {/* Photo */}
                  <PhotoUpload
                    value={form.photo_url || null}
                    onChange={(url) => setForm({ ...form, photo_url: url ?? "" })}
                    folder="doctor"
                    fallback={form.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("") || "Dr"}
                    asAdmin
                  />

                  {!editing && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/5 rounded-md border border-secondary/20">
                      <div className="col-span-2 text-xs font-semibold text-secondary uppercase tracking-wider">Credenciais de acesso</div>
                      <div><Label>Email profissional *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="dr.silva@clinicamargon.ao" /></div>
                      <div><Label>Palavra-passe (mín 8) *</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="•••••••" /></div>
                      <div className="col-span-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244…" /></div>
                    </div>
                  )}

                  {!editing && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-md border border-border/40">
                      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados pessoais do médico</div>
                      <div><Label>BI</Label><Input value={form.bi} onChange={(e) => setForm({ ...form, bi: e.target.value })} placeholder="000000000LA000" /></div>
                      <div><Label>Data de nascimento</Label><Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
                      <div>
                        <Label>Província</Label>
                        <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })}>
                          {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div><Label>Município</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                      <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Bairro, rua, nº…" /></div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                    <div>
                      <Label>Especialidade *</Label>
                      <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
                        <option value="">— escolher —</option>
                        {specialties.filter((s) => s.active).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div><Label>Anos de experiência</Label><Input type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: +e.target.value })} /></div>
                    <div className="col-span-2"><Label>Preço da consulta (Kz / AOA)</Label><Input type="number" step="1" value={form.consultation_price} onChange={(e) => setForm({ ...form, consultation_price: +e.target.value })} /></div>
                  </div>

                  <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>

                  {!editing && (
                    <div className="space-y-2 pt-3 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Horário de trabalho semanal</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, availability: [...form.availability, { day_of_week: 1, start_time: "08:00", end_time: "12:00", slot_minutes: 30 }] })}>
                          <Plus className="h-3 w-3" /> Adicionar bloco
                        </Button>
                      </div>
                      {form.availability.length === 0 && <p className="text-xs text-muted-foreground">Sem horário. Pode definir mais tarde em “Gerir agenda”.</p>}
                      {form.availability.map((a, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                          <select className="h-9 px-2 rounded-md border border-input bg-background text-sm" value={a.day_of_week} onChange={(e) => { const arr = [...form.availability]; arr[i] = { ...arr[i], day_of_week: +e.target.value }; setForm({ ...form, availability: arr }); }}>
                            {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                          </select>
                          <Input className="h-9 w-28" type="time" value={a.start_time} onChange={(e) => { const arr = [...form.availability]; arr[i] = { ...arr[i], start_time: e.target.value }; setForm({ ...form, availability: arr }); }} />
                          <Input className="h-9 w-28" type="time" value={a.end_time} onChange={(e) => { const arr = [...form.availability]; arr[i] = { ...arr[i], end_time: e.target.value }; setForm({ ...form, availability: arr }); }} />
                          <Input className="h-9 w-20" type="number" value={a.slot_minutes} onChange={(e) => { const arr = [...form.availability]; arr[i] = { ...arr[i], slot_minutes: +e.target.value }; setForm({ ...form, availability: arr }); }} title="Duração da consulta (min)" />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setForm({ ...form, availability: form.availability.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <Label>Experiência e instituições</Label>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, experiences: [...form.experiences, { name: "", url: "", description: "" }] })}>
                        <Plus className="h-3 w-3" /> Adicionar
                      </Button>
                    </div>
                    {form.experiences.map((exp, i) => (
                      <div key={i} className="grid gap-2 p-3 rounded-md border border-border/40 bg-muted/30">
                        <div className="flex gap-2">
                          <Input placeholder="Nome (ex: Hospital Central do Lubango)" value={exp.name} onChange={(e) => { const arr = [...form.experiences]; arr[i] = { ...arr[i], name: e.target.value }; setForm({ ...form, experiences: arr }); }} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setForm({ ...form, experiences: form.experiences.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <Input placeholder="Link (opcional)" value={exp.url ?? ""} onChange={(e) => { const arr = [...form.experiences]; arr[i] = { ...arr[i], url: e.target.value }; setForm({ ...form, experiences: arr }); }} />
                        <Input placeholder="Descrição curta (opcional)" value={exp.description ?? ""} onChange={(e) => { const arr = [...form.experiences]; arr[i] = { ...arr[i], description: e.target.value }; setForm({ ...form, experiences: arr }); }} />
                      </div>
                    ))}
                  </div>

                  <Button variant="hero" className="w-full" onClick={save} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> : doctors.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Nenhum médico cadastrado. Adicione o primeiro!</Card>
          ) : doctors.map((d) => (
            <Card key={d.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {d.photo_url ? (
                  <img src={d.photo_url} alt={d.full_name} className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
                ) : (
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{d.full_name}</p>
                  <p className="text-sm text-muted-foreground">{d.specialty} {d.years_experience ? `· ${d.years_experience} anos` : ""} {d.consultation_price ? `· ${formatAOA(d.consultation_price)}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleActive(d)}>{d.active ? "Ativo" : "Inativo"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => openAgenda(d)}><Clock className="h-4 w-4" /> Agenda</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}

          {/* Agenda dialog */}
          <Dialog open={!!agendaDoctor} onOpenChange={(o) => !o && setAgendaDoctor(null)}>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Agenda · {agendaDoctor?.full_name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end p-3 bg-muted/40 rounded-md">
                  <div>
                    <Label className="text-xs">Dia</Label>
                    <select className="h-9 w-full px-2 rounded-md border border-input bg-background text-sm" value={newBlock.day_of_week} onChange={(e) => setNewBlock({ ...newBlock, day_of_week: +e.target.value })}>
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div><Label className="text-xs">Início</Label><Input className="h-9 w-28" type="time" value={newBlock.start_time} onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })} /></div>
                  <div><Label className="text-xs">Fim</Label><Input className="h-9 w-28" type="time" value={newBlock.end_time} onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })} /></div>
                  <div><Label className="text-xs">Min</Label><Input className="h-9 w-20" type="number" value={newBlock.slot_minutes} onChange={(e) => setNewBlock({ ...newBlock, slot_minutes: +e.target.value })} /></div>
                  <Button size="sm" variant="hero" onClick={addBlock}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {agendaBlocks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sem horários definidos.</p> : agendaBlocks.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-md border border-border/40">
                      <div className="flex items-center gap-3"><Badge variant="secondary">{DAYS[b.day_of_week]}</Badge><span className="text-sm">{b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)} · {b.slot_minutes} min</span></div>
                      <Button size="sm" variant="ghost" onClick={() => b.id && removeBlock(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="specialties" className="mt-6 space-y-3">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Nome da especialidade (ex: Cardiologia)" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSpecialty()} />
              <Button variant="hero" onClick={addSpecialty}><Plus className="h-4 w-4" /> Adicionar</Button>
            </div>
          </Card>
          {specialties.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Sem especialidades. Adicione a primeira.</Card>
          ) : specialties.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-secondary" />
                <span className="font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleSpecialty(s)}>{s.active ? "Ativa" : "Inativa"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => removeSpecialty(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="locations" className="mt-6 space-y-3">
          <div className="flex justify-end">
            <Dialog open={locDialog} onOpenChange={setLocDialog}>
              <DialogTrigger asChild><Button variant="hero" onClick={openNewLoc}><Plus className="h-4 w-4" /> Novo local</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingLoc ? "Editar local" : "Novo local"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome *</Label><Input value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} placeholder="Clínica Margon — Filial X" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Província</Label><Input value={locForm.provincia} onChange={(e) => setLocForm({ ...locForm, provincia: e.target.value })} /></div>
                    <div><Label>Município</Label><Input value={locForm.municipio} onChange={(e) => setLocForm({ ...locForm, municipio: e.target.value })} /></div>
                  </div>
                  <div><Label>Bairro</Label><Input value={locForm.bairro} onChange={(e) => setLocForm({ ...locForm, bairro: e.target.value })} placeholder="Bairro Comercial, Cristo Rei…" /></div>
                  <div><Label>Endereço *</Label><Input value={locForm.endereco} onChange={(e) => setLocForm({ ...locForm, endereco: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Telefone</Label><Input value={locForm.phone} onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })} placeholder="+244…" /></div>
                    <div><Label>WhatsApp</Label><Input value={locForm.whatsapp} onChange={(e) => setLocForm({ ...locForm, whatsapp: e.target.value })} /></div>
                  </div>
                  <div><Label>Email</Label><Input value={locForm.email} onChange={(e) => setLocForm({ ...locForm, email: e.target.value })} /></div>
                  <div><Label>Horário</Label><Input value={locForm.opening_hours} onChange={(e) => setLocForm({ ...locForm, opening_hours: e.target.value })} placeholder="Seg-Sex 07:30-19:00" /></div>
                  <div><Label>Link Google Maps</Label><Input value={locForm.maps_url} onChange={(e) => setLocForm({ ...locForm, maps_url: e.target.value })} placeholder="https://maps.google.com/…" /></div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={locForm.is_main} onChange={(e) => setLocForm({ ...locForm, is_main: e.target.checked })} /> Sede principal
                  </label>
                  <Button variant="hero" className="w-full" onClick={saveLoc}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {locations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Nenhum local cadastrado.</Card>
          ) : locations.map((l) => (
            <Card key={l.id} className="p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-secondary mt-1" />
                <div>
                  <p className="font-semibold flex items-center gap-2">{l.name} {l.is_main && <Badge>Sede</Badge>}</p>
                  <p className="text-sm text-muted-foreground">{l.endereco}{l.bairro ? ` — ${l.bairro}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">{l.municipio}, {l.provincia} {l.phone && `· ${l.phone}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEditLoc(l)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => removeLoc(l.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="mt-6 space-y-3">
          {appts.length === 0 ? <Card className="p-8 text-center text-muted-foreground">Sem consultas.</Card> : appts.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-sm">{a.profiles?.full_name ?? "Paciente"} → Dr(a). {a.doctors?.full_name}</p>
                <p className="text-xs text-muted-foreground">{a.doctors?.specialty} · {format(parseISO(a.appointment_date), "PPP", { locale: pt })} {a.appointment_time.slice(0, 5)}</p>
              </div>
              <Badge variant="outline">{a.status}</Badge>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminDashboard;
