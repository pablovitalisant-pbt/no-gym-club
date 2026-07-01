-- Migration: enable_pgvector_corpus
-- Reemplaza ChromaDB por pgvector en Supabase

create extension if not exists vector;

create table sport_science_corpus (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  category text not null,
  tags text[] default array[]::text[],
  embedding vector(1536),
  created_at timestamptz default now()
);

create index idx_corpus_embedding on sport_science_corpus
  using ivfflat (embedding vector_cosine_ops) with (lists = 10);

create index idx_corpus_category on sport_science_corpus(category);

alter table sport_science_corpus enable row level security;

create or replace function search_corpus(
  query_embedding vector(1536),
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
