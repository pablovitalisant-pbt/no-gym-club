# CONTEXT-CLAUDE-CHAT.md — No Gym Club

Contexto para el Director Técnico (Claude chat). Snapshot de las decisiones de la Sesión 0 y estado del proyecto.

---

## Resumen del proyecto

App web SaaS de entrenamiento adaptativo. Concepto: **"La calle es mi gimnasio"**. Funciona como un entrenador personal que genera la sesión de cada día en base al historial completo del usuario, anclado a un corpus verificable de ciencia del deporte. Multi-tenant, bilingüe ES/EN.

Identidad: manifiesto No Gym Club. Disciplina sobre motivación. Anti-fitness-moda.

---

## Decisiones de stack (Sesión 0)

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase: Auth + PostgreSQL (RLS) + Storage
- DeepSeek V4 Flash (`deepseek-v4-flash`) vía SDK `openai`
- ChromaDB para RAG (corpus de ciencia del deporte)
- Vercel para deploy
- i18n bilingüe ES/EN desde el inicio

### Por qué DeepSeek y no Gemini

Gemini 2.0 Flash quedó deprecado (1 jun 2026). El free tier de Gemini tiene tope diario por proyecto que revienta al escalar y usa los prompts para entrenar. DeepSeek es pay-per-token (centavos al mes en MVP), tiene caché automático de prefijos (system prompt + corpus cacheados), endpoint compatible OpenAI, y Pablo ya lo domina.

### Estrategia de datos del catálogo

- Base: **free-exercise-db** (dominio público, 800+ ejercicios JSON) → import único a Supabase.
- GIFs: WorkoutX (free) / sample ExerciseDB, solo para los ~60-80 ejercicios de calle relevantes.
- Video propio: movimientos clave en Supabase Storage.
- En producción NO se depende de ninguna API externa de ejercicios.

---

## Modelo de funcionamiento (núcleo)

1. **Entrenador diario:** genera la sesión de hoy desde el historial (sesión anterior, grupo muscular previo, RPE, fallos, días desde última sesión, edad).
2. **Detraining:** uso libre. La condición decae con la inactividad. MVP usa "días desde última sesión" como input simple; modelo fino es post-MVP.
3. **Motor de sesión con tap:** Play → set → tap → cronómetro de descanso → aviso. Se registra el descanso real.
4. **Tres ciclos de evaluación:** diario (genera sesión), semanal (reporte + ajuste), mensual (re-assessment). Solo el diario está en el MVP.
5. **Inteligencia anclada:** RAG sobre ChromaDB. La IA no improvisa de memoria. Edad y grupo muscular como variables duras. Screening PAR-Q de seguridad antes de prescribir intensidad.

---

## Equipamiento oficial

`bodyweight`, `bar`, `ground`, `wall`, `dumbbell`

---

## Sistema de diseño

- Fondo: #0a0a0a (casi negro)
- Superficie: #111111, #1a1a1a
- Acento: #e8570a (naranja, energía de calle)
- Texto: #f5f5f5 / #888888
- Borde: #2a2a2a
- Tipografía: Inter
- Iconos: lucide-react

---

## Estado del proyecto

- **Fase actual:** Slice 3b completado (2026-06-30). Próximo: Slice 4.
- **Contador de slices desde último ponytail audit:** 3
- **Ponytail audit:** ejecutado 2026-06-30 post-Slice 2b. Próximo: contador 3, correr en ~Slice 6-7.
- **Próximo paso:** Pablo dice "siguiente slice".

### Slice 1a — Setup base (completado 2026-06-30)

Archivos creados:
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`
- `app/globals.css`, `.env.local.example`, `vitest.config.ts`, `tests/smoke.test.ts`

Archivos modificados:
- `.gitignore` — expandido con entradas de tooling

### Slice 1b — i18n setup + root layout (completado 2026-06-30)

Archivos creados:
- `i18n/config.ts` — locales `['es', 'en']`, default `es`
- `i18n/request.ts` — carga de mensajes por locale para next-intl
- `middleware.ts` — middleware de next-intl, matcher de exclusión estándar
- `messages/es.json` — metadata ES
- `messages/en.json` — metadata EN (keys simétricas con ES)
- `app/[locale]/layout.tsx` — root layout con Inter + NextIntlClientProvider
- `app/[locale]/page.tsx` — placeholder de una línea (reemplazado en Slice 1c)
- `tests/i18n-smoke.test.ts` — 4 tests (config, mensajes, middleware, matcher)

Archivos modificados:
- `next.config.mjs` — plugin next-intl reactivado (cierra marcador `ponytail:` de Slice 1a)

### Slice 1c — Landing page (manifiesto) (completado 2026-06-30)

Archivos creados:
- `lib/flags.ts` — `getFlag(key)` lee `config/feature-flags.json`, sync
- `components/ui/Button.tsx` — variantes `primary`/`ghost`, soporta `as="button"|"a"`
- `tests/landing-smoke.test.ts` — 8 tests (getFlag ×4, Button export, keys simétricas, feature-flags.json válido, hydration guard)

Archivos modificados:
- `app/[locale]/page.tsx` — placeholder → landing completa, gateada por `getFlag('landing_page')`
- `messages/es.json` — keys `landing.*` agregadas
- `messages/en.json` — keys `landing.*` (simétricas)
- `config/feature-flags.json` — `{ "landing_page": false }` (sin BOM)

> **Nota:** CTA es `<Button as="button">` sin href. Slice 2 lo migra a `<Link href="/signup">` cuando la ruta exista.

### Slice 2a — Supabase infra (completado 2026-06-30)

Archivos creados:
- `lib/supabase/server.ts` — `createClient()` server-side (cookies de `next/headers`)
- `lib/supabase/client.ts` — `createClient()` browser-side (`createBrowserClient`)
- `lib/supabase/middleware.ts` — `updateSession(request)` refresca token sin redirigir
- `tests/supabase-infra.test.ts` — 6 tests (server/client/middleware exports, matcher guard)

Archivos modificados:
- `middleware.ts` — encadenado: updateSession → intlMiddleware → merge cookies

> **Confirmado:** `config.matcher` es idéntico al de Slice 1b: `['/((?!api|_next|.*\\..*).*)']`.
> **Corrección Fase D Slice 2b:** `createServerClient` lanza si env vars son empty strings. Agregado guard en `updateSession`: sin credenciales → `NextResponse.next()` sin crashear.

### Slice 2b — Auth pages (completado 2026-06-30)

Archivos creados:
- `app/[locale]/(auth)/layout.tsx` — Server Component, lee `getFlag('auth')`, centrado dark
- `app/[locale]/(auth)/login/page.tsx` — Client Component, signInWithPassword
- `app/[locale]/(auth)/signup/page.tsx` — Client Component, signUp + confirm password
- `app/api/auth/callback/route.ts` — GET handler, exchangeCodeForSession → `/dashboard`
- `tests/auth-smoke.test.ts` — 6 tests (2 hydration guards, callback, keys, flag)

Archivos modificados:
- `messages/es.json` + `messages/en.json` — keys `auth.*` (9 keys, simétricas)
- `config/feature-flags.json` — `{ landing_page: false, auth: false }`
- `lib/supabase/middleware.ts` — guard env vars vacías

> **Nota:** login/signup son Client Components (`'use client'`). Layout de `(auth)` es Server Component.
> Callback redirige a `/dashboard` sin locale — next-intl lo resuelve.

### Slice 2c — Auth guard + dashboard + CTA migration (completado 2026-06-30)

Archivos creados:
- `app/[locale]/(app)/layout.tsx` — Server Component, shell mínimo (header + contenido)
- `app/[locale]/(app)/dashboard/page.tsx` — Server Component, gateado por flag `dashboard`
- `i18n/navigation.ts` — `createSharedPathnamesNavigation` → `{ Link, redirect }`
- `tests/dashboard-guard.test.ts` — 7 tests (guard selectividad, CTA Link, Button intacto, flag, keys, layout SSG, page exists)

Archivos modificados:
- `middleware.ts` — auth guard: verifica `getUser()` en rutas `/(app)`, redirect `/login`
- `app/[locale]/page.tsx` — CTA: `<Button>` → `<Link href="/signup">` de `@/i18n/navigation`
- `messages/es.json` + `en.json` — keys `dashboard.fallback`
- `config/feature-flags.json` — `"dashboard": false`

> **Nota scope creep:** `i18n/navigation.ts` no estaba en el contrato. Apareció en Fase C porque next-intl v3 exporta `Link` vía factory `createSharedPathnamesNavigation`, no como import directo. Archivo necesario, bajo impacto (5 líneas).

### Slice 3a — Schema documentation + types (completado 2026-06-30)

Archivos creados:
- `supabase/migrations/0001_initial_schema.sql` — 6 tablas + enums + RLS + trigger
- `supabase/migrations/0002_fix_function_search_path.sql` — fix security definer
- `supabase/schema.sql` — referencia completa
- `lib/supabase/types.ts` — Database interface (Row/Insert/Update para 6 tablas)
- `tests/schema-smoke.test.ts` — 7 tests

Archivos modificados:
- `config/feature-flags.json` — `schema_types: false`
- `tests/landing-smoke.test.ts` — fix race condition: writeFlags mergea (scope creep #5)

> **Contexto:** schema aplicado via MCP por el Director Tecnico. Este slice documenta.
> **Lineas:** 592 (DDL documentation-heavy).

### Slice 3b — Seed catalog (completado 2026-06-30)

Archivos creados:
- `supabase/seed.sql` — 33 ejercicios de calle (7 categorias x 3 niveles, 5 equipamientos)
- `tests/seed-smoke.test.ts` — 7 tests

Archivos modificados: ninguno (seed standalone).

> **Nota:** seed se aplica via MCP. Ejercicios 100% calle. URLs placeholder.

---

## Backlog de slices (MVP)

1. ~~Setup base~~ → dividido en:
   - **1a. Setup base + configs** ✅ (2026-06-30)
   - **1b. i18n setup + root layout** ✅ (2026-06-30)
   - **1c. Landing page (manifiesto)** ✅ (2026-06-30)
2. Auth + onboarding → dividido en:
   - **2a. Supabase infra (clients + middleware)** ✅ (2026-06-30)
   - **2b. Auth pages (login, signup, callback)** ✅ (2026-06-30)
   - **2c. Auth guard (app) + migración CTA + dashboard placeholder** ✅ (2026-06-30)
3. Schema DB + RLS + import del catalogo → dividido en:
   - **3a. Schema documentation + types** ✅ (2026-06-30)
   - **3b. Seed catalog (33 ejercicios de calle)** ✅ (2026-06-30)
4. Assessment: perfil + PAR-Q + equipamiento
5. Assessment: test físico guiado
6. Setup ChromaDB + corpus inicial de ciencia del deporte
7. Generación de sesión diaria por IA (DeepSeek + RAG)
8. Motor de sesión con tap timer
9. Log de sesión + RPE
10. Adaptación diaria (la sesión usa el log anterior)
11. Catálogo de ejercicios con media (vista + detalle)

El orden y la granularidad se ajustan en Fase A de cada slice.
