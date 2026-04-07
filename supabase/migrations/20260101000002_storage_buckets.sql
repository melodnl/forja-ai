-- Criar buckets via Supabase Dashboard ou CLI:
-- 1. 'generations' (público) — outputs de IA
-- 2. 'uploads' (privado) — uploads do usuário
-- 3. 'avatars' (público) — avatares de perfil
-- 4. 'thumbnails' (público) — thumbnails de boards/templates

-- Política de upload (exemplo pro bucket 'uploads')
CREATE POLICY "users_upload_own_files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_read_own_uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "public_read_generations" ON storage.objects
  FOR SELECT USING (bucket_id = 'generations');

CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "public_read_thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');
