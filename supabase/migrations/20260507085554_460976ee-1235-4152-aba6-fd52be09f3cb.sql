CREATE TABLE public.clinic_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provincia text NOT NULL DEFAULT 'Huíla',
  municipio text NOT NULL DEFAULT 'Lubango',
  bairro text,
  endereco text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  maps_url text,
  latitude numeric,
  longitude numeric,
  opening_hours text,
  is_main boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active locations" ON public.clinic_locations
  FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage locations" ON public.clinic_locations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_clinic_locations_updated_at
  BEFORE UPDATE ON public.clinic_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.clinic_locations (name, provincia, municipio, bairro, endereco, phone, whatsapp, email, maps_url, latitude, longitude, opening_hours, is_main)
VALUES (
  'Clínica Margon — Sede Lubango',
  'Huíla',
  'Lubango',
  'Bairro Comercial',
  'Rua da Sé Catedral, nº 45, Lubango, Huíla, Angola',
  '+244 923 000 000',
  '+244 923 000 000',
  'geral@margon.ao',
  'https://www.google.com/maps?q=-14.9177,13.4925',
  -14.9177,
  13.4925,
  'Seg-Sex 07:30-19:00 · Sáb 08:00-13:00',
  true
);