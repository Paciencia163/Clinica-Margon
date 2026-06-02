import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AvailabilityBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

interface Payload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  specialty: string;
  bio?: string;
  years_experience?: number;
  photo_url?: string;
  consultation_price?: number;
  experiences?: Array<{ name: string; url?: string; description?: string }>;
  availability?: AvailabilityBlock[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as Payload;
    if (!body.email || !body.password || body.password.length < 8 || !body.full_name || !body.specialty) {
      return new Response(JSON.stringify({ error: "Email, password (min 8), nome e especialidade são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. Create auth user (auto-confirmed)
    const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name, phone: body.phone ?? null },
    });
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: userErr?.message ?? "Erro ao criar utilizador" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const newUserId = userRes.user.id;

    // 2. Assign 'medico' role (replace default 'paciente')
    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: newUserId, role: "medico" });
    if (roleErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: roleErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Create doctor record
    const { data: doctorRow, error: docErr } = await admin
      .from("doctors")
      .insert({
        user_id: newUserId,
        full_name: body.full_name,
        specialty: body.specialty,
        bio: body.bio || null,
        years_experience: body.years_experience ?? 0,
        photo_url: body.photo_url || null,
        consultation_price: body.consultation_price ?? 0,
        experiences: body.experiences ?? [],
        active: true,
      })
      .select()
      .single();

    if (docErr || !doctorRow) {
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: docErr?.message ?? "Erro ao criar médico" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Insert availability blocks
    if (body.availability && body.availability.length > 0) {
      const rows = body.availability.map((a) => ({ ...a, doctor_id: doctorRow.id }));
      await admin.from("availability").insert(rows);
    }

    return new Response(JSON.stringify({ ok: true, doctor: doctorRow }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
