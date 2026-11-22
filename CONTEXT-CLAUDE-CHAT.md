# CONTEXT-CLAUDE-CHAT.md — No Gym Club

Contexto para el Director Técnico. Versión compacta (2026-11-21). El historial de slices v1 (Slice 1a … UI-8, Bugs #1–#8) está en git (`git show ab2ba60:CONTEXT-CLAUDE-CHAT.md`) y en BUGS.md.

## Proyecto

App de calistenia ("La calle es mi gimnasio"), bilingüe ES/EN, multi-tenant. **Pivote v2 (2026-11-21):** de "sesión diaria generada por IA" a **programa de 12 semanas en 3 fases de 4**, generado fase por fase y personalizado con los logs. Detalle y backlog: PRD.md §10. Referencia funcional: repo `pablovitalisant-pbt/calistenia` (app que Pablo usa). Fuente bibliográfica: *Overcoming Gravity* (Steven Low) — se usa parafraseado en el corpus, nunca texto literal.

## Stack

Next.js 14 App Router + TS + Tailwind · Supabase (Auth, Postgres+RLS, Storage, pgvector) · DeepSeek `deepseek-flash` (thinking activo, maxTokens 8192, ver Bug #4) · Embeddings NVIDIA NIM `nv-embedqa-e5-v5` (1024d) · next-intl · Vercel.

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

## Estado (2026-11-22 01:45)

- **v2 en producción (https://no-gym-club.vercel.app, deploy f126321, 2026-11-22)** (último commit: ver `git log`). Backlog PRD §10.6 ítems 1–10 hechos; 11 (videos) pendiente.
- Migraciones 0010–0012 aplicadas en Supabase (proyecto `jvfwnddijgwgokmjagpi`, vía conector Supabase). Corpus: 50 + 38 (Overcoming Gravity). Embeddings: `nvidia/nemotron-3.5-embed-1b` 1024d (Bug #9).
- QA Fase E (Codex) con excepción de base compartida (Opción A): assessment, plan (crear/navegar/completar/calendario/sesión) y modo de corrido en PASA tras fixes. QA-REGISTRO sin pendientes abiertos.
- Ponytail audit 2026-11-22: contador 0. Diferidos: borrar pipeline v1 (generate-session, build-session-prompt, flag ai_session_generation) DESPUÉS del release; refactor session-runner (780 L) y assessment-form; casts `as unknown as`; timezone del usuario (#16); trigger de integridad plan_id (#18); advisors Supabase (search_* SECURITY DEFINER ejecutables por anon, extensión vector en public, leaked password protection) — preexistentes.
- Release hecho con aprobación de Pablo (02:07, sin UAT local: app sin usuarios reales). Pendiente: configurar humoProd en qa-entorno.json para qa-prod.ps1. Flags a encender en `config/feature-flags.json` para el release: `training_plan_v2`, `plan_session_runner`, `continuous_session_mode`, `phase_generation_evidence_adjustment`. Sin variables de entorno nuevas. Luego push a main (Vercel despliega) y humo de producción.
- Cuentas QA: `qa.extremo@nogym.test`, `qa.intermedio@nogym.test`, `qa.nuevo@nogym.test` (contraseñas en `_dt\qa\cuentas.json`, se regeneran con `qa-preparar`).

