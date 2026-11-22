-- Slice v2-03a: Assessment v2 (datos)
-- Solo aditiva e idempotente. No elimina ni modifica datos existentes.

-- profiles: perfil ampliado
alter table profiles
  add column if not exists training_history text
    check (training_history in ('never','past','active'));
alter table profiles
  add column if not exists health_limitations text[] default '{}'
    check (health_limitations <@ array['knees','lower_back','shoulders','wrists','hips','other']::text[]);
alter table profiles
  add column if not exists limitations_notes text;
alter table profiles
  add column if not exists cardio_preference text default 'none'
    check (cardio_preference in ('none','light','moderate','intense'));
alter table profiles
  add column if not exists timezone text;

-- assessment_results: tests v2 (max_* ya son nullable; no se altera su nullability)
alter table assessment_results
  add column if not exists pushup_variant text
    check (pushup_variant in ('floor','knee','incline','wall','none'));
alter table assessment_results
  add column if not exists pushup_variant_reps integer
    check (pushup_variant_reps >= 0);
alter table assessment_results
  add column if not exists dead_hang_seconds integer
    check (dead_hang_seconds >= 0);
alter table assessment_results
  add column if not exists knee_plank_seconds integer
    check (knee_plank_seconds >= 0);
alter table assessment_results
  add column if not exists sit_to_stand_30s integer
    check (sit_to_stand_30s >= 0);
alter table assessment_results
  add column if not exists walk_minutes integer
    check (walk_minutes >= 0);
