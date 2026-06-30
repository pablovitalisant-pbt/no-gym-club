-- Migration: fix_function_search_path
-- Agrega security definer + search_path a update_updated_at para eliminar warning

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql security definer set search_path = public;
