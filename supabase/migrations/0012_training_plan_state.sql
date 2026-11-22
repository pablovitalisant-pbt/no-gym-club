-- Slice v2-04b: estado del plan de entrenamiento (12 semanas = 84 dias)
-- Solo aditiva e idempotente. No elimina ni modifica datos existentes.

alter table training_plans
  add column if not exists current_day_index int not null default 0
    check (current_day_index >= 0 and current_day_index < 84),
  add column if not exists completed_day_indexes int[] not null default '{}',
  add column if not exists start_level text,
  add column if not exists status text not null default 'active'
    check (status in ('active','completed','abandoned'));

alter table workout_sessions
  add column if not exists plan_day_index int
    check (plan_day_index >= 0 and plan_day_index < 84);

create index if not exists idx_workout_sessions_plan_day
  on workout_sessions(plan_id, plan_day_index);

-- Un solo plan activo por usuario.
create unique index if not exists idx_training_plans_one_active
  on training_plans(user_id) where is_active;
