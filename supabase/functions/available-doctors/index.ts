import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface Slot {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

const computeSlots = (s: Slot): string[] => {
  const [h1, m1] = s.start_time.split(":").map(Number);
  const [h2, m2] = s.end_time.split(":").map(Number);
  let cur = h1 * 60 + m1;
  const end = h2 * 60 + m2;
  const out: string[] = [];
  while (cur + s.slot_minutes <= end) {
    out.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += s.slot_minutes;
  }
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date");
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Response(JSON.stringify({ error: "Parâmetro 'date' (YYYY-MM-DD) obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const target = new Date(`${dateStr}T00:00:00`);
    const dow = target.getDay();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [{ data: doctors }, { data: availability }, { data: appts }] = await Promise.all([
      supabase.from("doctors").select("id, full_name, specialty, photo_url, consultation_price").eq("active", true),
      supabase.from("availability").select("doctor_id, day_of_week, start_time, end_time, slot_minutes").eq("day_of_week", dow),
      supabase.from("appointments").select("doctor_id, appointment_time").eq("appointment_date", dateStr).neq("status", "cancelada"),
    ]);

    const takenByDoc = new Map<string, Set<string>>();
    (appts ?? []).forEach((a: any) => {
      const set = takenByDoc.get(a.doctor_id) ?? new Set<string>();
      set.add(a.appointment_time.slice(0, 5));
      takenByDoc.set(a.doctor_id, set);
    });

    const slotsByDoc = new Map<string, { times: string[]; durationMin: number }>();
    (availability ?? []).forEach((s: any) => {
      const entry = slotsByDoc.get(s.doctor_id) ?? { times: [], durationMin: s.slot_minutes };
      entry.times.push(...computeSlots(s));
      entry.durationMin = s.slot_minutes;
      slotsByDoc.set(s.doctor_id, entry);
    });

    const result = (doctors ?? []).map((d: any) => {
      const slots = slotsByDoc.get(d.id);
      const taken = takenByDoc.get(d.id) ?? new Set();
      const free = slots ? slots.times.filter((t) => !taken.has(t)) : [];
      return {
        ...d,
        slot_minutes: slots?.durationMin ?? null,
        free_slots: free,
        free_count: free.length,
        total_count: slots?.times.length ?? 0,
      };
    }).filter((d) => d.total_count > 0);

    return new Response(JSON.stringify({
      date: dateStr,
      timezone: "Africa/Luanda",
      doctors: result,
      available_count: result.filter((d) => d.free_count > 0).length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
