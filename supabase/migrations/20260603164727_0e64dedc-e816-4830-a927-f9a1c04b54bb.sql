
-- 1. Allow anon to execute has_role so RLS policies don't fail for logged-out visitors
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;

-- 2. Doctors can view profiles of their own patients (needed to show patient name)
CREATE POLICY "Doctors view their patients profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = profiles.id
      AND d.user_id = auth.uid()
  )
);

-- 3. Add cancellation reason + who cancelled
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 4. Specialties catalog for admin management
CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.specialties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.specialties TO authenticated;
GRANT ALL ON public.specialties TO service_role;

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active specialties"
ON public.specialties FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage specialties"
ON public.specialties FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER specialties_updated
BEFORE UPDATE ON public.specialties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed common specialties from existing doctors
INSERT INTO public.specialties (name)
SELECT DISTINCT specialty FROM public.doctors WHERE specialty IS NOT NULL
ON CONFLICT (name) DO NOTHING;
