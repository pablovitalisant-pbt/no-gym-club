-- Slice v2-21: configuración de perfil (nombre, foto y preferencias)
-- Solo aditiva. No elimina ni modifica datos existentes.

alter table profiles
  add column if not exists display_name text
    check (char_length(display_name) <= 40),
  add column if not exists avatar_url text,
  add column if not exists theme_preference text not null default 'dark'
    check (theme_preference in ('light','dark','system'));

-- Bucket público de avatares; la escritura queda limitada a la carpeta del usuario.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars public read'
  ) then
    create policy "avatars public read"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars insert own folder'
  ) then
    create policy "avatars insert own folder"
      on storage.objects for insert
      with check (
        bucket_id = 'avatars'
        and storage.foldername(name)[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars update own folder'
  ) then
    create policy "avatars update own folder"
      on storage.objects for update
      using (
        bucket_id = 'avatars'
        and storage.foldername(name)[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and storage.foldername(name)[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars delete own folder'
  ) then
    create policy "avatars delete own folder"
      on storage.objects for delete
      using (
        bucket_id = 'avatars'
        and storage.foldername(name)[1] = auth.uid()::text
      );
  end if;
end $$;
