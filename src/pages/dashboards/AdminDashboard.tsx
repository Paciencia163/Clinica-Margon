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
import { Loader2, Plus, Edit, Trash2, Users, Stethoscope, Calendar, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { formatAOA } from "@/lib/format";

interface Experience { name: string; url?: string; description?: string; }
interface Doctor { id: string; full_name: string; specialty: string; bio: string | null; years_experience: number | null; photo_url: string | null; consultation_price: number | null; active: boolean; user_id: string | null; experiences?: Experience[] | null; }
interface Location { id: string; name: string; provincia: string; municipio: string; bairro: string | null; endereco: string; phone: string | null; whatsapp: string | null; email: string | null; maps_url: string | null; opening_hours: string | null; is_main: boolean; active: boolean; }

const empty = { full_name: "", specialty: "", bio: "", years_experience: 0, photo_url: "", consultation_price: 0, user_email: "", experiences: [] as Experience[] };
const emptyLoc = { name: "", provincia: "Huíla", municipio: "Lubango", bairro: "", endereco: "", phone: "", whatsapp: "", email: "", maps_url: "", opening_hours: "", is_main: false };

const AdminDashboard = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locDialog, setLocDialog] = useState(false);
  const [locForm, setLocForm] = useState(emptyLoc);

  const load = async () => {
    const [{ data: d }, { data: a }, { data: l }] = await Promise.all([
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("appointments").select("*, doctors(full_name, specialty), profiles!appointments_patient_id_fkey(full_name)").order("appointment_date", { ascending: false }).limit(50),
      supabase.from("clinic_locations").select("*").order("is_main", { ascending: false }),
    ]);
    setDoctors((d as any) ?? []);
    setAppts(a ?? []);
    setLocations((l as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setDialog(true); };
  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({ full_name: d.full_name, specialty: d.specialty, bio: d.bio ?? "", years_experience: d.years_experience ?? 0, photo_url: d.photo_url ?? "", consultation_price: Number(d.consultation_price ?? 0), user_email: "", experiences: (d.experiences as Experience[]) ?? [] });
    setDialog(true);
  };

  const save = async () => {
    if (!form.full_name || !form.specialty) return toast.error("Nome e especialidade obrigatórios");
    const payload: any = {
      full_name: form.full_name,
      specialty: form.specialty,
      bio: form.bio || null,
      years_experience: form.years_experience,
      photo_url: form.photo_url || null,
      consultation_price: form.consultation_price,
      experiences: form.experiences.filter((e) => e.name?.trim()),
    };
    if (editing) {
      const { error } = await supabase.from("doctors").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Médico atualizado");
    } else {
      const { error } = await supabase.from("doctors").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Médico criado");
    }
    setDialog(false);
    load();
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

  const openNewLoc = () => { setEditingLoc(null); setLocForm(emptyLoc); setLocDialog(true); };
  const openEditLoc = (l: Location) => {
    setEditingLoc(l);
    setLocForm({
      name: l.name, provincia: l.provincia, municipio: l.municipio, bairro: l.bairro ?? "",
      endereco: l.endereco, phone: l.phone ?? "", whatsapp: l.whatsapp ?? "", email: l.email ?? "",
      maps_url: l.maps_url ?? "", opening_hours: l.opening_hours ?? "", is_main: l.is_main,
    });
    setLocDialog(true);
  };
  const saveLoc = async () => {
    if (!locForm.name || !locForm.endereco) return toast.error("Nome e endereço obrigatórios");
    const payload: any = {
      ...locForm,
      bairro: locForm.bairro || null,
      phone: locForm.phone || null,
      whatsapp: locForm.whatsapp || null,
      email: locForm.email || null,
      maps_url: locForm.maps_url || null,
      opening_hours: locForm.opening_hours || null,
    };
    const { error } = editingLoc
      ? await supabase.from("clinic_locations").update(payload).eq("id", editingLoc.id)
      : await supabase.from("clinic_locations").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingLoc ? "Local atualizado" : "Local criado");
    setLocDialog(false);
    load();
  };
  const removeLoc = async (id: string) => {
    if (!confirm("Remover este local?")) return;
    const { error } = await supabase.from("clinic_locations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  return (
    <DashboardLayout title="Administração" subtitle="Gerencie médicos, locais e consultas da clínica">
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 flex items-center gap-4"><Stethoscope className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Médicos</p><p className="text-2xl font-display font-bold">{doctors.length}</p></div></Card>
        <Card className="p-5 flex items-center gap-4"><Calendar className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Consultas</p><p className="text-2xl font-display font-bold">{appts.length}</p></div></Card>
        <Card className="p-5 flex items-center gap-4"><Users className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Ativas</p><p className="text-2xl font-display font-bold">{appts.filter((a) => a.status !== "cancelada").length}</p></div></Card>
        <Card className="p-5 flex items-center gap-4"><MapPin className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Locais</p><p className="text-2xl font-display font-bold">{locations.length}</p></div></Card>
      </div>

      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="mt-6 space-y-3">
          <div className="flex justify-end">
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild><Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> Novo médico</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editing ? "Editar médico" : "Novo médico"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                  <div><Label>Especialidade *</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
                  <div><Label>Foto (URL)</Label><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Anos experiência</Label><Input type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: +e.target.value })} /></div>
                    <div><Label>Preço (Kz / AOA)</Label><Input type="number" step="1" value={form.consultation_price} onChange={(e) => setForm({ ...form, consultation_price: +e.target.value })} /></div>
                  </div>
                  <div><Label>Bio / experiência</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <Label>Experiência e instituições</Label>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, experiences: [...form.experiences, { name: "", url: "", description: "" }] })}>
                        <Plus className="h-3 w-3" /> Adicionar
                      </Button>
                    </div>
                    {form.experiences.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma instituição. Adicione hospitais, clínicas ou universidades.</p>}
                    {form.experiences.map((exp, i) => (
                      <div key={i} className="grid gap-2 p-3 rounded-md border border-border/40 bg-muted/30">
                        <div className="flex gap-2">
                          <Input placeholder="Nome (ex: Hospital Central do Lubango)" value={exp.name} onChange={(e) => { const arr = [...form.experiences]; arr[i] = { ...arr[i], name: e.target.value }; setForm({ ...form, experiences: arr }); }} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setForm({ ...form, experiences: form.experiences.filter((_, j) => j !== i) })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input placeholder="Link (opcional)" value={exp.url ?? ""} onChange={(e) => { const arr = [...form.experiences]; arr[i] = { ...arr[i], url: e.target.value }; setForm({ ...form, experiences: arr }); }} />
                        <Input placeholder="Descrição curta (opcional)" value={exp.description ?? ""} onChange={(e) => { const arr = [...form.experiences]; arr[i] = { ...arr[i], description: e.target.value }; setForm({ ...form, experiences: arr }); }} />
                      </div>
                    ))}
                  </div>

                  <Button variant="hero" className="w-full" onClick={save}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> : doctors.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">Nenhum médico cadastrado. Adicione o primeiro!</Card>
          ) : doctors.map((d) => (
            <Card key={d.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="font-semibold">{d.full_name}</p>
                  <p className="text-sm text-muted-foreground">{d.specialty} {d.years_experience ? `· ${d.years_experience} anos` : ""} {d.consultation_price ? `· ${formatAOA(d.consultation_price)}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleActive(d)}>{d.active ? "Ativo" : "Inativo"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
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
