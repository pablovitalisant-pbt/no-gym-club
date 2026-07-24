-- Exercises embedding + RAG search

alter table exercises add column if not exists embedding vector(1024);
create index if not exists idx_exercises_embedding on exercises using ivfflat (embedding vector_cosine_ops) with (lists = 10);

create or replace function search_exercises(
  query_embedding vector(1024),
  match_count int default 60,
  filter_equipment equipment_type[] default null
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
    order by e.embedding <=> query_embedding
    limit match_count;
end;
$$;
