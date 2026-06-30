# CLAUDE.md — No Gym Club

Documento operativo para Claude Code. Leer junto con `~/.claude/CLAUDE.md` (semilla global) y `PRD.md`.

---

## Stack decidido

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Estilos:** Tailwind CSS
- **Auth + DB + Storage:** Supabase (PostgreSQL con Row Level Security)
- **LLM:** DeepSeek V4 Flash (`deepseek-v4-flash`) vía SDK `openai` (endpoint compatible OpenAI)
- **RAG:** ChromaDB (corpus de ciencia del deporte)
- **i18n:** next-intl (ES default, EN secundario)
- **Deploy:** Vercel

> Usar `deepseek-v4-flash` explícito. NO usar `deepseek-chat` ni `deepseek-reasoner` (deprecados 2026-07-24).

---

## Comandos de desarrollo

```
npm run dev        # servidor de desarrollo
npm run build      # build de produccion
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest (unit)
npm run test:e2e   # playwright (e2e)
```

---

## Estructura de carpetas

```
no-gym-club/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/          # login, signup
│   │   ├── (app)/           # rutas protegidas: dashboard, assessment, session, exercises, progress
│   │   └── page.tsx         # landing (manifiesto)
│   └── api/                 # route handlers (generar sesion, etc.)
├── components/
│   ├── ui/                  # primitivos (Button, Card, Badge, Input, Modal)
│   ├── exercise/
│   ├── session/             # SessionTimer, ExerciseLogger
│   ├── assessment/
│   └── layout/
├── lib/
│   ├── supabase/            # client.ts, server.ts, middleware.ts
│   ├── deepseek/            # client.ts (SDK openai apuntando a DeepSeek)
│   ├── chroma/              # cliente y consultas al corpus
│   ├── prompts/             # construccion de prompts para generar sesiones
│   └── utils.ts
├── messages/                # es.json, en.json
├── supabase/                # schema.sql, seed.sql, migraciones
├── config/                  # feature-flags.json
├── data/                    # import del catalogo (free-exercise-db filtrado)
├── tests/
└── docs/
```

---

## Naming conventions

- Componentes: PascalCase (`SessionTimer.tsx`)
- Hooks: camelCase con prefijo `use` (`useRestTimer.ts`)
- Utilidades / libs: camelCase (`buildSessionPrompt.ts`)
- Rutas API: kebab-case (`/api/generate-session`)
- Tablas DB: snake_case plural (`workout_sessions`)
- Columnas DB: snake_case
- Campos bilingues: sufijo `_es` / `_en` (`name_es`, `name_en`)
- Feature flags: snake_case en `config/feature-flags.json`, default `false`

---

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
CHROMA_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Reglas del proyecto (PBT-IA)

- Contratos primero (Fase A), tests que rompen antes de implementar (Fase B), implementacion minima (Fase C), feature flag en false (Fase D).
- Cada slice: maximo 200 lineas. Si excede, proponer sub-slices.
- Cambios entregados como DIFF unificado por archivo.
- No tocar archivos fuera del alcance sin autorizacion.
- No hacer commits sin aprobacion explicita de Pablo.
- RLS obligatorio en todas las tablas con datos de usuario. Catalogo de ejercicios: lectura publica.
- Toda sesion generada pasa el screening PAR-Q antes de prescribir intensidad.

---

## Referencia al PRD

Toda decision de producto, alcance del MVP, fuentes de datos y zonas de riesgo viven en `PRD.md`. El backlog de slices se deriva del MVP definido ahi.

---

## Debugging

Protocolo en `~/.claude/skills/pbt-ia-debugging.md`

Se activa con: "hay un bug", "se rompio", "dejo de funcionar", "sigue pasando"

Registro: `BUGS.md` en la raiz del proyecto
