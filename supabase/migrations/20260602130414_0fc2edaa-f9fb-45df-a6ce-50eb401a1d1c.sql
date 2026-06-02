
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';
