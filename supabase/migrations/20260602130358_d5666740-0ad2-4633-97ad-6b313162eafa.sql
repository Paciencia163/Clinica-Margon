
-- Drop if previously created (safe re-run)
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to own folder in avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admin manage avatars" ON storage.objects;

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload to own folder in avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin manage avatars"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));
