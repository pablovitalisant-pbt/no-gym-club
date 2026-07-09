# PRD — No Gym Club

## 1. Qué es el proyecto

**No Gym Club** es una aplicación web SaaS de entrenamiento adaptativo construida sobre el concepto **"La calle es mi gimnasio"**: todos los ejercicios se pueden hacer en la calle con equipamiento mínimo que cualquiera encuentra en cualquier ciudad (el propio cuerpo, una barra de parque, un muro, el suelo, un bordillo).

La app se comporta como un **entrenador personal que observa y analiza día a día** el avance del usuario. No entrega un plan fijo: al terminar cada sesión, evalúa el resultado y genera la sesión siguiente en base a los datos recibidos. El objetivo es guiar la transformación corporal de cada persona desde su punto de partida hasta la meta que defina, con una evolución constante y medible.

### Identidad de marca

El tono y los valores del producto están definidos por el manifiesto No Gym Club: disciplina por sobre motivación, acción por sobre comodidad, progreso brutal y silencioso. Anti-fitness-moda. La estética y la comunicación de toda la app responden a esa identidad.

---

## 2. Usuarios

- **Usuario entrenado (rol principal):** cualquier persona, de cualquier nivel (principiante absoluto hasta avanzado), que quiere transformar su condición física entrenando en la calle. Hace el assessment inicial, ejecuta las sesiones diarias, registra sus resultados y sigue su evolución.

La app es **multi-tenant**: cada usuario tiene su cuenta, su perfil, su historial y su progreso completamente aislados de los demás (Row Level Security).

---

## 3. MVP — Lo mínimo que debe funcionar

1. **Auth + onboarding** — registro/login (Supabase Auth). Cada usuario tiene cuenta propia.
2. **Assessment inicial** — perfil (edad, peso, altura, objetivo, días disponibles, equipamiento disponible) + screening de seguridad tipo PAR-Q + test físico guiado (máx. push-ups, pull-ups, squats, dips, plancha en segundos).
3. **Generación de la sesión diaria por IA** — DeepSeek genera la sesión de hoy anclado al corpus de ciencia del deporte (RAG sobre pgvector, tabla `sport_science_corpus`), considerando el historial completo del usuario: sesión anterior, grupo muscular trabajado, RPE, fallos, días desde la última sesión y edad.
4. **Motor de sesión con tap** — el usuario aprieta Play, ejecuta cada set, da un tap al terminar el set, se cronometra el descanso y la app avisa cuándo volver. Registra el descanso real tomado (no solo el prescrito). Cronómetro con alarma para ejercicios por tiempo (calentamiento, main, estiramiento). Registro inmediato de reps reales por ejercicio, sin esperar al final de la sesión. Descanso entre calentamiento y primer set generado por la IA según condición física del atleta. Toggle de audio on/off.
5. **Log de sesión + RPE** — al terminar toda la sesión, el usuario registra el RPE (1-10) y notas. Ese log alimenta la generación de la sesión siguiente.
6. **Adaptación diaria** — la sesión siguiente se construye a partir del log de la anterior.
7. **Catálogo de ejercicios con media** — imagen / GIF / video, instrucciones bilingües (ES/EN), músculos, dificultad, cadenas de progresión y regresión.

La app es **bilingüe ES/EN desde el día uno**.

---

## 4. Qué NO es parte del MVP

- Evaluación semanal formal (reporte de evolución + ajuste de trayectoria).
- Re-assessment mensual (repetir tests físicos para medir progreso objetivo).
- Modelo de detraining refinado (en el MVP se considera "días desde última sesión" como input simple a la IA; el modelo de decaimiento fino viene después).
- Skill Map visual (árbol de habilidades desbloqueadas).
- Gráficos e historial de progreso.
- Modo offline / PWA.
- Pagos / planes de suscripción.

---

## 5. Integraciones externas conocidas

- **DeepSeek API** (modelo `deepseek-v4-flash`) vía SDK `openai` — generación adaptativa de sesiones. Pay-per-token. Endpoint compatible con OpenAI.
- **Supabase** — Auth, PostgreSQL (con RLS) y Storage (videos/imágenes de ejercicios).
- **pgvector** (extensión de Supabase) — base de conocimiento vectorial con tabla `sport_science_corpus` + función `search_corpus()` para RAG. Reemplazó a ChromaDB.

### Fuentes de datos del catálogo (import único, sin dependencia en producción)

- **free-exercise-db (yuhonas)** — dataset de dominio público (800+ ejercicios en JSON). Base del catálogo. Sin licencia, sin rate limits, sin atribución. Limpio para uso comercial.
- **GIFs** de WorkoutX (free tier) y/o sample gratuito de ExerciseDB — solo para enriquecer los ejercicios de calle relevantes (~60-80), no el catálogo completo.
- **Video propio** — movimientos clave grabados/curados y alojados en Supabase Storage.

> Principio de datos: la app NO depende de ninguna API externa de ejercicios en producción. Todo el catálogo vive en Supabase tras un import único. Esto elimina rate limits, caídas de terceros y riesgo legal.

---

## 6. Restricciones técnicas

- **Stack decidido y no negociable:** Next.js 14 (App Router) + TypeScript + Tailwind CSS, Supabase (Auth + PostgreSQL con RLS + Storage), DeepSeek V4 Flash vía SDK `openai`, pgvector (extensión Supabase, tabla `sport_science_corpus`) para RAG, Vercel para deploy.
- **i18n:** bilingüe ES/EN desde el inicio.
- **Modelo LLM:** usar `deepseek-v4-flash` explícito. Los alias `deepseek-chat` y `deepseek-reasoner` se deprecan el 24 de julio de 2026.
- **Privacidad de IA:** no enviar datos personales identificables del usuario a la API sin anonimizar.
- **Seguridad de prescripción:** ninguna sesión se genera sin pasar el screening PAR-Q. La intensidad máxima (entrenamiento al fallo) no se prescribe a principiantes sin progresión previa.

---

## 7. Inteligencia del sistema (núcleo del producto)

La app debe comportarse como un experto real en ciencia del deporte, no como un LLM improvisando de memoria.

- **RAG obligatorio:** la IA razona **anclada al corpus de pgvector (tabla `sport_science_corpus`)**, no de su memoria. El corpus contiene principios verificables: sobrecarga progresiva, periodización, hipertrofia vs. resistencia, programación para principiantes, curvas de detraining, autorregulación por RPE/RIR, y recuperación modulada por edad.
- **Variable edad:** entra en todos los cálculos de recuperación, volumen y progresión. La capacidad de recuperación varía con la edad.
- **Variable grupo muscular:** la generación diaria considera el grupo muscular trabajado en la sesión anterior para rotar y respetar la recuperación.
- **Orientación a objetivo:** cada sesión apunta a la meta declarada en el assessment inicial; la tendencia semanal debe ser coherente con ese objetivo.
- **Verificabilidad:** el corpus se cura con fuentes reales. El PRD especifica el comportamiento; los datos fisiológicos concretos viven en el corpus, no se inventan en código.

---

## 8. Escala esperada

Primeros 6 meses: escala pequeña (validación). DeepSeek pay-per-token escala sin muro de requests; el costo por usuario es de centavos al mes gracias al caché automático de prefijos (system prompt + corpus cacheados). Supabase free/pro tier cubre el volumen inicial.

---

## 9. Zonas de riesgo conocidas

| Archivo / módulo | Riesgo | Qué no tocar sin revisar |
|-----------------|--------|--------------------------|
| `middleware.ts` | (1) Fusión de cookies: `updateSession` + `intlMiddleware` mergean cookies manualmente. Si next-intl futuramente setea cookies propias (locale preference), pueden colisionar con las de Supabase. (2) Auth guard: crea otro `createServerClient` para verificar sesión en rutas `/(app)`. Tiene el mismo riesgo de env vars vacías que `updateSession` — requiere guard explícito. | Revisar el orden de merge y los nombres de cookies antes de agregar nuevas cookies al middleware. No remover el guard de env vars del auth guard ni de `updateSession`. |
| `lib/supabase/middleware.ts` | `createServerClient` de `@supabase/ssr` lanza error si `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` son strings vacíos (no acepta vacíos, contrario a lo asumido en Slice 2a). El guard `if (!env) return NextResponse.next()` mitiga esto en `updateSession`, pero `server.ts` usa `!` y lanzará si se invoca sin credenciales. | No remover el guard de `updateSession` sin tener credenciales configuradas. No llamar `createClient()` de `server.ts` sin validar que las env vars existen. |
| `NVIDIA_API_KEY` | Key actual de tipo "API testing", expira 2027-01-01. No apta para producción de largo plazo. Sin key válida, `search_corpus()` devuelve vacío y las sesiones se generan sin anclaje científico. | Migrar a key de producción de NVIDIA AI Enterprise antes del primer deploy con usuarios reales. No hardcodear la key; siempre desde variable de entorno. |
| Schema / migraciones | Si se recrea el schema desde cero sin correr 0006, el rol `authenticated` no tiene permisos DML — `permission denied` en runtime. | Siempre correr todas las migraciones en orden. La 0006 (`grant_authenticated_dml.sql`) debe ejecutarse después de crear las tablas. |
| Auth — reset de contraseña | No existe flujo de "olvidé mi contraseña" en la app (ni antes ni después del rediseño UI-4). Supabase Auth soporta `resetPasswordForEmail()` nativamente — no está integrado. Se decidió explícitamente no agregar un link decorativo sin funcionalidad real en UI-4 (2026-07-08). | Si se agrega un link de "olvidé mi contraseña" en cualquier pantalla, debe ir acompañado del flujo real (server action + pantalla de confirmación + template de email), no como placeholder visual. |
| `session/[id]/actions.ts` — `mergeLogData()` | Toda escritura a `log_data` (columna JSON de `workout_sessions`) debe pasar por `mergeLogData()` (SELECT + spread + UPDATE). Durante el set de sub-slices de corrección del session runner (2026-07-07) se encontraron y corrigieron dos bugs reales en este archivo: (1) `saveSessionTimes()` hacía overwrite directo de `log_data` sin merge, pisando `exerciseLog` si corría después; (2) `saveExerciseReps()` optimista mandaba solo la entrada nueva (`[entry]`) en vez del ref acumulado completo, causando pérdida silenciosa de entradas previas si la sesión no llegaba a `state === 'done'`. Cualquier función nueva que escriba `log_data` debe reusar `mergeLogData()` y mandar listas completas (nunca deltas) desde un ref local autoritativo. | No agregar un `.update({ log_data: ... })` directo en ningún archivo nuevo — siempre pasar por `mergeLogData()`. No mandar arrays parciales/delta a funciones que reemplazan una key de `log_data` completa. |
| Suite de tests — flakiness intermitente | Detectado durante UI-6 (2026-07-08): corriendo `npx vitest run` varias veces seguidas sin tocar código, falla un test distinto en cada corrida (`dashboard-guard.test.ts` una vez, `session-generate-smoke.test.ts` otra), nunca el mismo dos veces. No está ligado a ningún slice — es infraestructura de test (probablemente condición de carrera en la paralelización de Vitest). | Antes de asumir que un test roto es culpa de un cambio nuevo, correr la suite 2-3 veces para descartar flakiness preexistente. Pendiente: investigar en un ponytail audit — candidatos: mocks compartidos entre archivos de test, orden de ejecución no determinista, recursos (env vars, fs) compartidos sin aislar. |
