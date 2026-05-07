
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT 'Lubango',
  ADD COLUMN IF NOT EXISTS provincia TEXT DEFAULT 'Huíla',
  ADD COLUMN IF NOT EXISTS bi TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, endereco, cidade, provincia, bi, data_nascimento)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'endereco',
    COALESCE(NEW.raw_user_meta_data->>'cidade', 'Lubango'),
    COALESCE(NEW.raw_user_meta_data->>'provincia', 'Huíla'),
    NEW.raw_user_meta_data->>'bi',
    NULLIF(NEW.raw_user_meta_data->>'data_nascimento','')::date
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'paciente');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  med1_id uuid := gen_random_uuid();
  med2_id uuid := gen_random_uuid();
  med3_id uuid := gen_random_uuid();
  med4_id uuid := gen_random_uuid();
  pac1_id uuid := gen_random_uuid();
  pac2_id uuid := gen_random_uuid();
  doc1 uuid; doc2 uuid; doc3 uuid; doc4 uuid;
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
   ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 'admin@margon.ao', crypt('Admin@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Joaquim Ndombele','phone','+244 923 100 001','endereco','Rua Mártires da Liberdade, nº 12','cidade','Lubango','provincia','Huíla','bi','000123456LA041'), now(), now(), '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', med1_id, 'authenticated', 'authenticated', 'dr.silva@margon.ao', crypt('Medico@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Dr. António Silva','phone','+244 923 200 001','endereco','Bairro Comercial, Rua Pinheiro Chagas 45','cidade','Lubango','provincia','Huíla','bi','000200001LA041'), now(), now(), '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', med2_id, 'authenticated', 'authenticated', 'dra.cassinda@margon.ao', crypt('Medico@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Dra. Beatriz Cassinda','phone','+244 923 200 002','endereco','Bairro da Mapunda, Rua 7 de Setembro 88','cidade','Lubango','provincia','Huíla','bi','000200002LA041'), now(), now(), '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', med3_id, 'authenticated', 'authenticated', 'dr.tchikuteny@margon.ao', crypt('Medico@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Dr. Manuel Tchikuteny','phone','+244 923 200 003','endereco','Bairro Tchioco, Avenida Mandume 210','cidade','Lubango','provincia','Huíla','bi','000200003LA041'), now(), now(), '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', med4_id, 'authenticated', 'authenticated', 'dra.kafuxi@margon.ao', crypt('Medico@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Dra. Ngueve Kafuxi','phone','+244 923 200 004','endereco','Bairro Nambambi, Rua das Acácias 5','cidade','Lubango','provincia','Huíla','bi','000200004LA041'), now(), now(), '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', pac1_id, 'authenticated', 'authenticated', 'paciente@margon.ao', crypt('Paciente@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Esperança Tchipalavela','phone','+244 923 300 001','endereco','Bairro Hoji-ya-Henda, Rua 11 de Novembro 33','cidade','Lubango','provincia','Huíla','bi','000300001LA041','data_nascimento','1995-04-12'), now(), now(), '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', pac2_id, 'authenticated', 'authenticated', 'carlos.maria@margon.ao', crypt('Paciente@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','Carlos Maria','phone','+244 923 300 002','endereco','Bairro Lalula, Rua dos Combatentes 18','cidade','Lubango','provincia','Huíla','bi','000300002LA041','data_nascimento','1988-09-22'), now(), now(), '', '', '', '');

  UPDATE public.user_roles SET role = 'admin' WHERE user_id = admin_id;
  UPDATE public.user_roles SET role = 'medico' WHERE user_id IN (med1_id, med2_id, med3_id, med4_id);

  INSERT INTO public.doctors (user_id, full_name, specialty, bio, years_experience, consultation_price, photo_url, active) VALUES
   (med1_id, 'Dr. António Silva', 'Cardiologia', 'Cardiologista com vasta experiência em cuidados clínicos no Lubango.', 15, 25000, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400', true),
   (med2_id, 'Dra. Beatriz Cassinda', 'Pediatria', 'Pediatra dedicada à saúde infantil na província da Huíla.', 10, 20000, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400', true),
   (med3_id, 'Dr. Manuel Tchikuteny', 'Clínica Geral', 'Médico de família com forte ligação à comunidade do Lubango.', 8, 15000, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400', true),
   (med4_id, 'Dra. Ngueve Kafuxi', 'Ginecologia', 'Ginecologista especializada em saúde da mulher.', 12, 22000, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', true);

  SELECT id INTO doc1 FROM public.doctors WHERE user_id = med1_id;
  SELECT id INTO doc2 FROM public.doctors WHERE user_id = med2_id;
  SELECT id INTO doc3 FROM public.doctors WHERE user_id = med3_id;
  SELECT id INTO doc4 FROM public.doctors WHERE user_id = med4_id;

  INSERT INTO public.availability (doctor_id, day_of_week, start_time, end_time, slot_minutes)
  SELECT d, dow, '08:00'::time, '12:00'::time, 30
  FROM (VALUES (doc1),(doc2),(doc3),(doc4)) AS dd(d), generate_series(1,5) AS dow;

  INSERT INTO public.availability (doctor_id, day_of_week, start_time, end_time, slot_minutes)
  SELECT d, dow, '14:00'::time, '17:00'::time, 30
  FROM (VALUES (doc1),(doc2),(doc3),(doc4)) AS dd(d), generate_series(1,5) AS dow;

  INSERT INTO public.appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes) VALUES
   (pac1_id, doc1, CURRENT_DATE + 2, '09:00', 'confirmada', 'Consulta de rotina cardíaca'),
   (pac1_id, doc2, CURRENT_DATE + 5, '10:30', 'pendente', 'Acompanhamento'),
   (pac2_id, doc3, CURRENT_DATE + 1, '15:00', 'confirmada', 'Check-up geral'),
   (pac2_id, doc4, CURRENT_DATE - 7, '11:00', 'realizada', 'Consulta concluída');
END $$;
