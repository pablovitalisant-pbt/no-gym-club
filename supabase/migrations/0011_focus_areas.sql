-- Slice v2-03c: Assessment v2 (meta particular / énfasis)
-- Solo aditiva e idempotente. No elimina ni modifica datos existentes.

alter table profiles
  add column if not exists focus_areas text[] default '{}'
    check (focus_areas <@ array['chest','shoulders','back','arms','legs','glutes','core','skill_pullup','skill_handstand','skill_muscleup','skill_pistol']::text[]);
alter table profiles
  add column if not exists focus_notes text;
