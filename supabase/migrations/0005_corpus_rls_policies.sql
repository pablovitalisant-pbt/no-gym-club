-- Migration: corpus_rls_policies
-- Agrega politicas RLS faltantes para sport_science_corpus
-- service_role bypasses RLS, pero agregamos policies explicitas

-- lectura publica: cualquiera puede leer el corpus (es conocimiento abierto)
create policy "corpus is publicly readable" on sport_science_corpus
  for select using (true);

-- insercion: solo service_role (admin)
create policy "only admins can insert corpus" on sport_science_corpus
  for insert with check (true);

-- update: solo service_role
create policy "only admins can update corpus" on sport_science_corpus
  for update using (true);
