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

- **Fase actual:** Slice 1b completado (2026-06-30). Próximo: Slice 1c.
- **Contador de slices desde último ponytail audit:** 2
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

---

## Backlog de slices (MVP)

1. ~~Setup base~~ → dividido en:
   - **1a. Setup base + configs** ✅ (2026-06-30)
   - **1b. i18n setup + root layout** ✅ (2026-06-30)
   - **1c. Landing page (manifiesto)**
2. Auth + onboarding (Supabase Auth)
3. Schema DB + RLS + import del catálogo (free-exercise-db filtrado)
4. Assessment: perfil + PAR-Q + equipamiento
5. Assessment: test físico guiado
6. Setup ChromaDB + corpus inicial de ciencia del deporte
7. Generación de sesión diaria por IA (DeepSeek + RAG)
8. Motor de sesión con tap timer
9. Log de sesión + RPE
10. Adaptación diaria (la sesión usa el log anterior)
11. Catálogo de ejercicios con media (vista + detalle)

El orden y la granularidad se ajustan en Fase A de cada slice.
