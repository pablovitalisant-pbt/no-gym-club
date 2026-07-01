-- Ajuste dimensiones: 1536 → 1024 (NVIDIA NV-Embed V1)
drop index if exists idx_corpus_embedding;
alter table sport_science_corpus alter column embedding type vector(1024);
create index idx_corpus_embedding on sport_science_corpus using ivfflat (embedding vector_cosine_ops) with (lists = 10);
create or replace function search_corpus(query_embedding vector(1024), match_count int default 5, filter_category text default null)
returns table (id uuid, title text, content text, category text, tags text[], similarity float)
language plpgsql security definer set search_path = public as $$
begin
  return query select c.id, c.title, c.content, c.category, c.tags, 1 - (c.embedding <=> query_embedding) as similarity
  from sport_science_corpus c
  where (filter_category is null or c.category = filter_category) and c.embedding is not null
  order by c.embedding <=> query_embedding limit match_count;
end; $$;
