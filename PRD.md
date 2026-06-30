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
3. **Generación de la sesión diaria por IA** — DeepSeek genera la sesión de hoy anclado al corpus de ciencia del deporte (RAG sobre ChromaDB), considerando el historial completo del usuario: sesión anterior, grupo muscular trabajado, RPE, fallos, días desde la última sesión y edad.
4. **Motor de sesión con tap** — el usuario aprieta Play, ejecuta cada set, da un tap al terminar el set, se cronometra el descanso y la app avisa cuándo volver. Registra el descanso real tomado (no solo el prescrito).
5. **Log de sesión + RPE** — al terminar, el usuario registra resultados y RPE (1-10). Ese log alimenta la generación de la sesión siguiente.
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
- **ChromaDB** — base de conocimiento vectorial con el corpus de ciencia del deporte para RAG.

### Fuentes de datos del catálogo (import único, sin dependencia en producción)

- **free-exercise-db (yuhonas)** — dataset de dominio público (800+ ejercicios en JSON). Base del catálogo. Sin licencia, sin rate limits, sin atribución. Limpio para uso comercial.
- **GIFs** de WorkoutX (free tier) y/o sample gratuito de ExerciseDB — solo para enriquecer los ejercicios de calle relevantes (~60-80), no el catálogo completo.
- **Video propio** — movimientos clave grabados/curados y alojados en Supabase Storage.

> Principio de datos: la app NO depende de ninguna API externa de ejercicios en producción. Todo el catálogo vive en Supabase tras un import único. Esto elimina rate limits, caídas de terceros y riesgo legal.

---

## 6. Restricciones técnicas

- **Stack decidido y no negociable:** Next.js 14 (App Router) + TypeScript + Tailwind CSS, Supabase (Auth + PostgreSQL con RLS + Storage), DeepSeek V4 Flash vía SDK `openai`, ChromaDB para RAG, Vercel para deploy.
- **i18n:** bilingüe ES/EN desde el inicio.
- **Modelo LLM:** usar `deepseek-v4-flash` explícito. Los alias `deepseek-chat` y `deepseek-reasoner` se deprecan el 24 de julio de 2026.
- **Privacidad de IA:** no enviar datos personales identificables del usuario a la API sin anonimizar.
- **Seguridad de prescripción:** ninguna sesión se genera sin pasar el screening PAR-Q. La intensidad máxima (entrenamiento al fallo) no se prescribe a principiantes sin progresión previa.

---

## 7. Inteligencia del sistema (núcleo del producto)

La app debe comportarse como un experto real en ciencia del deporte, no como un LLM improvisando de memoria.

- **RAG obligatorio:** la IA razona **anclada al corpus de ChromaDB**, no de su memoria. El corpus contiene principios verificables: sobrecarga progresiva, periodización, hipertrofia vs. resistencia, programación para principiantes, curvas de detraining, autorregulación por RPE/RIR, y recuperación modulada por edad.
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
| `middleware.ts` | Fusión de cookies: `updateSession` + `intlMiddleware` mergean cookies manualmente. Si next-intl futuramente setea cookies propias (locale preference), pueden colisionar con las de Supabase. | Revisar el orden de merge y los nombres de cookies antes de agregar nuevas cookies al middleware. |
