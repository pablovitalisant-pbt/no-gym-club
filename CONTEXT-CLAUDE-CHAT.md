# CONTEXT-CLAUDE-CHAT.md — No Gym Club

Contexto para el Director Técnico. Versión compacta (2026-11-21). El historial de slices v1 (Slice 1a … UI-8, Bugs #1–#8) está en git (`git show ab2ba60:CONTEXT-CLAUDE-CHAT.md`) y en BUGS.md.

## Proyecto

App de calistenia ("La calle es mi gimnasio"), bilingüe ES/EN, multi-tenant. **Pivote v2 (2026-11-21):** de "sesión diaria generada por IA" a **programa de 12 semanas en 3 fases de 4**, generado fase por fase y personalizado con los logs. Detalle y backlog: PRD.md §10. Referencia funcional: repo `pablovitalisant-pbt/calistenia` (app que Pablo usa). Fuente bibliográfica: *Overcoming Gravity* (Steven Low) — se usa parafraseado en el corpus, nunca texto literal.

## Stack

Next.js 14 App Router + TS + Tailwind · Supabase (Auth, Postgres+RLS, Storage, pgvector) · DeepSeek `deepseek-v4-flash` (thinking activo, maxTokens 8192, ver Bug #4) · Embeddings NVIDIA NIM `nv-embedqa-e5-v5` (1024d) · next-intl · Vercel.

Diseño: fondo #0a0a0a, superficies #111/#1a1a1a, acento #e8570a, texto #f5f5f5/#888, borde #2a2a2a, Inter, lucide-react.

## Operación (Modo PowerShell)

- Prompts y logs en `..\_dt\` (fuera del repo). Base del Programador: `_dt\prompts\_base.md`.
- Lanzar Programador: `& C:\Users\pablo\Documents\no-gym-club\_dt\prog.ps1 -Name <n> [-Fase A|BCD|DEBUG] -Detach`.
  - `auto`: **claude-deep** en horario económico de DeepSeek; **Codex** (`gpt-reserve`, low) en horario caro (01:00–04:00 y 06:00–10:00 UTC, lun–vie; fines de semana y feriados chinos son económicos). Regla de Pablo 2026-11-21.
  - Se pueden usar en paralelo: deep programa el slice N mientras Codex hace QA/verificación del N-1.
- **Ahorro de tokens (regla de Pablo):** prompts cortos que apuntan a archivos, contratos acotados, reportes ≤8 líneas, verificación con salida resumida; el DT lee `git diff --stat` antes de abrir diffs.
- Consultas/actualizaciones de datos: scripts Node en `_dt\scripts\` con la service role key de `.env.local` (ejecutar con cwd = repo). No hay Supabase CLI ni psql instalados; DDL pendiente de definir vía conexión Postgres (`supabase_pass`).
- **No hay base de datos de prueba:** local y producción usan el mismo proyecto Supabase. Todo cambio de datos con respaldo previo en `_dt\backups\`.
- Commits: solo el DT, desde PowerShell de Windows (en el shell Linux de la sesión git no puede borrar locks).

## Estado

- **Fase actual:** v2, slice 1 (catálogo solo calistenia + retiro de GIFs).
- Catálogo al 2026-11-21: 616 ejercicios activos, 616 con gif_url, 292 con `dumbbell`.
- Archivos sin commitear heredados de v1: `scripts/import-exercisedb-bodyweight.ts`, `scripts/seed-corpus-json.ts`, `supabase/corpus.json`, `supabase/seed-corpus-embeddings-clean.sql`.
- **Contador de slices desde último ponytail audit:** 0 (v2 arranca; el último audit registrado fue 2026-06-30 → correr antes del primer deploy v2).
