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

- **DeepSeek API** (modelo `deepseek-flash`) vía SDK `openai` — generación adaptativa de sesiones. Pay-per-token. Endpoint compatible con OpenAI.
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
- **Modelo LLM:** usar `deepseek-flash` explícito (nombre vigente; `deepseek-v4-flash` es el alias legacy). Los alias `deepseek-chat` y `deepseek-reasoner` se deprecan el 24 de julio de 2026.
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
| Timezone de usuario — no manejado en ningún lado | La app entera calcula fechas/días en base a `completed_at` (UTC, vía `toISOString()`) sin conocer el timezone real del usuario. Confirmado concretamente en `getWeeklyDayMarkers()` (UI-8, `lib/progress/report-helpers.ts`): una sesión completada tarde en la noche en un timezone detrás de UTC (ej. Chile, UTC-3) puede quedar atribuida al día equivocado en el panel de consistencia. No es un bug de un slice específico — es una limitación de diseño de toda la app, nunca se capturó el timezone del usuario en ningún formulario ni se guardó en el perfil. | No asumir que fechas calculadas de `completed_at` reflejan el día calendario real del usuario. Si se resuelve, hacerlo una vez a nivel de perfil de usuario (capturar timezone en el assessment o detectarlo del browser), no parche por parche en cada función que use fechas. |

---

## 10. Versión 2 — Programas por fases (aprobado por Pablo 2026-11-21)

> Reemplaza los ítems 3 y 6 del MVP (sesión diaria generada por IA / adaptación diaria). Todo lo demás del PRD sigue vigente salvo que esta sección diga lo contrario.

### 10.1 Por qué

Generar una sesión distinta cada día impide la sobrecarga progresiva: el usuario nunca repite un ejercicio el tiempo suficiente para progresar en él. La práctica estándar es el mesociclo (~4–6 semanas con la misma selección de ejercicios, progresando volumen/intensidad) y cambiar al terminarlo. Modelo de referencia: la app `pablovitalisant-pbt/calistenia` (la que Pablo usa con buenos resultados) y programas tipo Beachbody (Beast Body, Insanity). Fuente bibliográfica principal: *Overcoming Gravity* (Steven Low, 2.ª ed.), capítulos 5–7, 10, 12, 13 y 17–20.

### 10.2 Comportamiento

1. **Se genera un programa, no una sesión.** Programa de 12 semanas = 3 fases de 4 semanas. Cada fase tiene una plantilla semanal (días de entrenamiento según `available_days_per_week` + días de descanso) que se repite igual las 4 semanas.
2. **Generación fase por fase.** La fase 1 se genera al completar el assessment. La fase N+1 se genera al cerrar la fase N, usando los logs reales (reps por serie, RPE) de esa fase. Personalización por bloques de 4 semanas, no por día.
3. **Puntero al día actual, no a la fecha.** El usuario avanza con "Completar día". Si falta un día, no pierde nada. Puede navegar ‹ › entre días y abrir un calendario con los 84 días (completados, actual, descanso).
4. **Cada día del plan** tiene calentamiento, bloque principal, finisher opcional, cardio opcional y vuelta a la calma; cada ejercicio con series, objetivo (reps o tiempo) y descanso. Mismo formato que consume el session runner.
5. **Registro por serie** (reps/segundos reales) durante la sesión; RPE al final.
6. **La generación diaria por IA se retira** (ruta `generate-session` y botón "Generar" del dashboard) detrás de feature flag.

### 10.3 Assessment v2 — todo tipo de usuario

- Caso extremo obligatorio: persona de 50+ años, obesidad, nunca entrenó. El assessment debe capturar historial de entrenamiento (nunca / hace años / activo), limitaciones articulares o de salud declaradas, y capacidad real mediante tests con regresiones (push-up en pared/inclinada, sentarse-pararse de una silla, plancha en rodillas, caminata). Ningún test asume que el usuario puede hacer un push-up o una dominada.
- El generador debe poder prescribir desde el nivel más bajo (regresiones extremas, caminata) hasta avanzado, apoyado en el corpus (población, principiante no entrenado).
- **Meta particular (énfasis):** el assessment pregunta si el usuario quiere priorizar zonas o habilidades (p. ej. hombros y pecho, espalda, brazos, piernas/glúteos, core, o habilidades como dominada, handstand, muscle-up), más texto libre. El programa da más volumen a esas zonas sin romper el equilibrio estructural (empuje/tracción). Pedido de Pablo 2026-11-21.
- **Cardio opcional:** el assessment pregunta si el usuario quiere cardio y con qué intensidad (ninguno / suave / moderado / intenso). El plan lo incluye según la respuesta, respetando la condición del usuario.

### 10.4 Modo "de corrido" (tipo Beachbody)

Un botón Play inicia la sesión completa y el cronómetro avanza solo: trabajo → descanso → siguiente ejercicio, sin taps intermedios, hasta terminar. Pausa y Stop siempre disponibles. Cada ejercicio del plan tiene una duración de trabajo usable por este modo (los de reps llevan ventana de trabajo). El registro de reps en este modo es opcional al final. El modo con taps actual se mantiene.

### 10.5 Catálogo — solo calistenia

- El catálogo contiene solo ejercicios de calistenia (peso corporal, barra, suelo, pared, banco/plaza). Los demás (mancuernas, balón, bosu, máquinas, poleas, etc.) se desactivan (`is_active=false`, reversible), no se borran.
- Los GIFs actuales se retiran (no representan bien los ejercicios): las URLs quedan en null y la UI muestra el placeholder. **No se eliminan las guías visuales: se reemplazarán** por videos cortos propios o generados con IA (backlog posterior). Los archivos en Supabase Storage no se borran sin aprobación de Pablo (acción destructiva).

### 10.6 Backlog v2 (orden)

1. Catálogo solo calistenia + retiro de GIFs (placeholders).
2. Entorno QA del proyecto (`.pbravot/qa-entorno.json`, cuentas sintéticas incluido el perfil 50+/obesidad/sin entrenamiento).
3. Assessment v2 (historial, limitaciones, tests con regresiones, cardio opcional).
4. Corpus: principios de *Overcoming Gravity* parafraseados (población, principiante, mesociclos, progresión, cardio) + modelo de datos del plan (`training_plans.plan_data`, `workout_sessions.plan_id` + índice de día).
5. Generador de fase (DeepSeek + RAG) → fase 1 al terminar el assessment.
6. Dashboard con puntero al día actual + calendario de 84 días.
7. Session runner alimentado por el día del plan.
8. Generación de la fase siguiente con los logs de la fase cerrada.
9. Modo "de corrido".
10. Retiro de la generación diaria + limpieza.
11. (Después) Videos cortos de ejercicios.

### 10.7 Flujos críticos y criterios de aceptación v2

| ID | Rol | Dado | Cuando | Entonces (lo que el usuario VE) | Riesgo |
|----|-----|------|--------|-------------------------------|--------|
| R1 | Usuario | catálogo depurado | abre /exercises | solo ejercicios de calistenia; ninguno con "dumbbell", "exercise ball", "bosu", "cable"; cada tarjeta con placeholder visual | medio |
| R2 | Usuario 50+, obeso, sin entrenamiento | assessment v2 | completa el assessment | puede responder todos los tests (con regresiones) sin quedar bloqueado; ve su programa de fase 1 con ejercicios de nivel muy bajo | alto |
| R3 | Usuario | assessment completo | entra al dashboard | ve "Semana 1 · Día 1", el tipo de día y sus ejercicios; botones ‹ › y calendario | alto |
| R4 | Usuario | día actual | completa el día | el puntero pasa al día siguiente; el calendario marca el día como completado | alto |
| R5 | Usuario | semana 2 | abre un día equivalente de la semana 1 | ve los mismos ejercicios que la semana 1 (misma fase) | alto |
| R6 | Usuario | fin de la fase 1 | completa el día 28 | se genera la fase 2 y la ve en el día 29 | alto |
| R7 | Usuario | cardio elegido en assessment | ve sus días | el cardio aparece con la intensidad elegida; si eligió "ninguno", no aparece | medio |
| R9 | Usuario | eligió énfasis hombros y pecho | ve su plan de fase 1 | los días de empuje tienen más series/ejercicios de hombro y pecho que el resto, y sigue habiendo tracción | medio |
| R8 | Usuario | día con ejercicios | pulsa Play en modo de corrido | la sesión avanza sola trabajo→descanso→siguiente hasta el final; Pausa y Stop funcionan | alto |

---

## 11. Configuración y comunidad (aprobado por Pablo 2026-11-22 09:54–09:57)

### 11.1 Configuración personal
Pantalla `/settings`: foto de perfil, nombre con el que la app saluda al usuario, tema (claro / oscuro / sistema), idioma, sonido, actualizar evaluación, rehacer programa, cerrar sesión.

### 11.2 Comunidad — reglas aprobadas
1. **Opt-in, apagado por defecto:** nadie aparece en "Cerca de ti" hasta activar su perfil público.
2. **Ubicación aproximada, nunca exacta:** se muestra la comuna o una distancia redondeada ("a ~3 km"); la posición se guarda redondeada (nunca coordenadas exactas) y jamás se dibuja un punto en un mapa.
3. **Solo mayores de 18** en la parte social (edad del perfil).
4. **Chat solo entre conexiones aceptadas:** solicitud → aceptación → chat.
5. **Bloquear y reportar** desde el primer día; un bloqueo oculta mutuamente perfiles, solicitudes y chat.
6. **Perfil público mínimo y elegido por el usuario:** foto, nombre, nivel, meta, comuna y **descripción libre opcional** (pedido de Pablo; máx. 280 caracteres, reportable).
7. **Etapas:** (1) perfil público + cercanos; (2) solicitudes + chat 1:1 (Supabase Realtime); (3) entrenamientos en pareja/grupo generados según el nivel de los participantes.

| ID | Rol | Dado | Cuando | Entonces (lo que el usuario VE) | Riesgo |
|----|-----|------|--------|-------------------------------|--------|
| C1 | Usuario sin perfil público | — | abre "Cerca de ti" | una invitación a activar su perfil público; no ve a otros ni es visible | alto |
| C2 | Usuario < 18 | perfil con edad < 18 | intenta activar perfil público | un aviso de que la comunidad es para mayores de 18; no puede activarlo | alto |
| C3 | Usuario con perfil público | otros perfiles públicos cercanos | abre "Cerca de ti" | lista con foto, nombre, nivel, comuna/distancia aproximada; nunca coordenadas ni mapa | alto |
| C4 | Usuario | ve un perfil | lo bloquea | ese perfil desaparece de su lista y él desaparece de la del otro | alto |
| C5 | Usuario | no hay conexión aceptada | intenta chatear | solo ve "Enviar solicitud" | alto |
