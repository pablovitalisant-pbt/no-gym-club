-- Supabase Schema — No Gym Club
-- Referencia completa. Aplicado via migraciones en supabase/migrations/

create extension if not exists "uuid-ossp";

-- Enums
create type experience_level as enum ('beginner', 'intermediate', 'advanced');
create type primary_goal as enum ('lose_weight','build_muscle','improve_endurance','master_skills','general_fitness');
create type equipment_type as enum ('bodyweight', 'bar', 'ground', 'wall', 'dumbbell');
create type exercise_category as enum ('push', 'pull', 'core', 'legs', 'cardio', 'mobility', 'skill');
create type exercise_difficulty as enum ('beginner', 'intermediate', 'advanced');
create type skill_status as enum ('locked', 'in_progress', 'unlocked');

-- Tablas
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique, full_name text,
  age integer check (age >= 10 and age <= 100),
  weight_kg numeric(5,2) check (weight_kg > 0),
  height_cm numeric(5,2) check (height_cm > 0),
  experience_level experience_level default 'beginner',
  primary_goal primary_goal default 'general_fitness',
  available_days_per_week integer check (available_days_per_week >= 1 and available_days_per_week <= 7),
  available_equipment equipment_type[] default array['bodyweight']::equipment_type[],
  locale text default 'es' check (locale in ('es', 'en')),
  par_q_cleared boolean default false,
  par_q_answered_at timestamptz,
  assessment_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exercises (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null, name_es text not null, name_en text not null,
  description_es text, description_en text,
  instructions_es text[] default array[]::text[],
  instructions_en text[] default array[]::text[],
  muscle_groups text[] default array[]::text[],
  secondary_muscles text[] default array[]::text[],
  equipment_required equipment_type[] default array['bodyweight']::equipment_type[],
  difficulty exercise_difficulty not null default 'beginner',
  category exercise_category not null,
  image_url text, gif_url text, video_url text,
  progression_ids uuid[] default array[]::uuid[],
  regression_ids uuid[] default array[]::uuid[],
  is_active boolean default true,
  embedding vector(1024),
  created_at timestamptz default now()
);

create table assessment_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  max_pushups integer check (max_pushups >= 0),
  max_pullups integer check (max_pullups >= 0),
  max_squats integer check (max_squats >= 0),
  max_dips integer check (max_dips >= 0),
  plank_seconds integer check (plank_seconds >= 0),
  notes text, assessed_at timestamptz default now()
);

create table training_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title_es text, title_en text,
  generated_by_ai boolean default true,
  plan_data jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid references training_plans(id) on delete set null,
  scheduled_date date, completed_at timestamptz,
  session_data jsonb default '{}'::jsonb,
  log_data jsonb, rpe integer check (rpe >= 1 and rpe <= 10),
  days_since_last integer, notes text,
  created_at timestamptz default now()
);

create table skill_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  status skill_status default 'locked',
  unlocked_at timestamptz, personal_best jsonb,
  unique (user_id, exercise_id)
);

-- Indices
create index idx_assessment_results_user_id on assessment_results(user_id);
create index idx_training_plans_user_id on training_plans(user_id);
create index idx_workout_sessions_user_id on workout_sessions(user_id);
create index idx_workout_sessions_scheduled_date on workout_sessions(scheduled_date);
create index idx_skill_progress_user_id on skill_progress(user_id);
create index idx_exercises_slug on exercises(slug);
create index idx_exercises_category on exercises(category);
create index idx_exercises_difficulty on exercises(difficulty);
create index idx_exercises_embedding on exercises using ivfflat (embedding vector_cosine_ops) with (lists = 10);

create or replace function search_exercises(
  query_embedding vector(1024),
  match_count int default 60,
  filter_equipment equipment_type[] default null,
  filter_category text default null
)
returns table (name_en text, category exercise_category, muscle_groups text[], similarity float)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select e.name_en, e.category, e.muscle_groups,
      1 - (e.embedding <=> query_embedding) as similarity
    from exercises e
    where e.is_active = true and e.embedding is not null
      and (filter_equipment is null or e.equipment_required && filter_equipment)
      and (filter_category is null or e.category::text = filter_category)
    order by e.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Trigger: update_updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger training_plans_updated_at before update on training_plans for each row execute function update_updated_at();

-- RLS
alter table profiles enable row level security;
alter table assessment_results enable row level security;
alter table training_plans enable row level security;
alter table workout_sessions enable row level security;
alter table skill_progress enable row level security;
alter table exercises enable row level security;

-- Policies
create policy "users can view own profile" on profiles for select using (auth.uid() = id);
create policy "users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users can view own assessments" on assessment_results for select using (auth.uid() = user_id);
create policy "users can insert own assessments" on assessment_results for insert with check (auth.uid() = user_id);
create policy "users can view own plans" on training_plans for select using (auth.uid() = user_id);
create policy "users can insert own plans" on training_plans for insert with check (auth.uid() = user_id);
create policy "users can update own plans" on training_plans for update using (auth.uid() = user_id);
create policy "users can view own sessions" on workout_sessions for select using (auth.uid() = user_id);
create policy "users can insert own sessions" on workout_sessions for insert with check (auth.uid() = user_id);
create policy "users can update own sessions" on workout_sessions for update using (auth.uid() = user_id);
create policy "users can view own skill progress" on skill_progress for select using (auth.uid() = user_id);
create policy "users can insert own skill progress" on skill_progress for insert with check (auth.uid() = user_id);
create policy "users can update own skill progress" on skill_progress for update using (auth.uid() = user_id);
create policy "exercises are publicly readable" on exercises for select using (true);

-- pgvector: sport science corpus (RAG)
create extension if not exists vector;

create table sport_science_corpus (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  category text not null,
  tags text[] default array[]::text[],
  embedding vector(1024),
  created_at timestamptz default now()
);

create index idx_corpus_embedding on sport_science_corpus
  using ivfflat (embedding vector_cosine_ops) with (lists = 10);

create index idx_corpus_category on sport_science_corpus(category);

alter table sport_science_corpus enable row level security;

create or replace function search_corpus(
  query_embedding vector(1024),
  match_count int default 5,
  filter_category text default null
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  tags text[],
  similarity float
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select
      c.id, c.title, c.content, c.category, c.tags,
      1 - (c.embedding <=> query_embedding) as similarity
    from sport_science_corpus c
    where
      (filter_category is null or c.category = filter_category)
      and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count;
end;
$$;
