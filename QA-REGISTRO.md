# QA-REGISTRO

Registro automatico de la Fase E (Metodo pBravoT, ver ~/.claude/PBRAVOT-QA.md).
Cada pendiente se cierra cambiando `[ ]` por `[x]` y agregando la resolucion al final de la linea:
`-> ARREGLADO <commit>` / `-> BACKLOG <referencia>` / `-> DESCARTADO <motivo>`.
Con pendientes (alta) o (critica) abiertos, el hook pre-commit bloquea el commit. BACKLOG solo para media o baja.

## 2026-11-21 23:59 - v2-assessment - commit d56cc04 - BLOQUEADO
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-assessment
- Sin pendientes nuevos.

## 2026-11-22 00:06 - v2-assessment-b - commit d56cc04 - INVALIDO
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-assessment-b
- [x] P-20261122-0006-1 (media) HALLAZGO: EXP-1 — Peso fuera de rango sin validación visible -> ARREGLADO (commit v2-fix-qa-assessment)
- [x] P-20261122-0006-2 (baja) HALLAZGO: EXP-2 — Texto largo en limitaciones -> ARREGLADO (commit v2-fix-qa-assessment; limitations_notes sin validación de largo en servidor -> BACKLOG cleanup v2-10)

## 2026-11-22 00:52 - v2-plan - commit 43a6f94 - FALLA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-plan
- [x] P-20261122-0052-1 (media) FALLA: QA-02 — La navegación de días avanza un día más de lo esperado -> DESCARTADO caso mal formulado por el DT: Semana 1 Dia 1 -> Semana 2 Dia 1 son 7 avances, no 8; la app mostro correctamente Semana 2 Dia 2 tras 8 (dayInfo idx 8 = semana 2, weekday 1; cubierto por tests/plan-dayinfo.test.ts)

## 2026-11-22 01:10 - v2-corrido - commit 4c72c59 - BLOQUEADO
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-corrido
- [x] P-20261122-0110-1 (alta) HALLAZGO: EXP-1 — `/en` responde 500 -> DESCARTADO entorno: 500 por `npm run build` concurrente del Programador sobre el mismo .next mientras corria el dev de QA (log v2-qa-fixture-plan: PageNotFoundError); en la corrida siguiente v2-corrido-b /en funciono
- [x] P-20261122-0110-2 (alta) CONSOLA: Failed to load resource: the server responded with a status of 502 (Bad Gateway) (/api/generate-phase) -> ARREGLADO v2-11 (#3: el prompt sugeria session null en dias de entrenamiento -> validacion fallida 2 veces -> 502); DT verifico /api/generate-phase 200 en 56 s (intermedio, fase 2)
- [x] P-20261122-0110-3 (alta) CONSOLA: Failed to load resource: the server responded with a status of 500 (Internal Server Error) (/es/login) -> DESCARTADO entorno: misma causa que P-20261122-0110-1
- [x] P-20261122-0110-4 (alta) CONSOLA: Failed to load resource: the server responded with a status of 500 (Internal Server Error) (/en) -> DESCARTADO entorno: misma causa que P-20261122-0110-1

## 2026-11-22 01:23 - v2-corrido-b - commit 4c72c59 - FALLA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-corrido-b
- [x] P-20261122-0123-1 (alta) FALLA: QA-04 — La sesión no se reanuda tras recargar -> ARREGLADO v2-fix-qa-corrido (resumeRunnerState al montar el runner); re-QA pendiente
- [x] P-20261122-0123-2 (baja) HALLAZGO: EXP-1 — Audio apagado visible en modo inglés -> DESCARTADO observacion sin defecto: el toggle de audio funciona en /en

## 2026-11-22 01:30 - v2-corrido-reqa - commit 77016a4 - PASA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-corrido-reqa
- Sin pendientes nuevos.

## 2026-11-24 07:15 - v2-24 - commit 45e401b - FALLA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-24
- [x] P-20261124-0715-1 (media) FALLA: QA-02 — "INICIAR SESIÓN →" se encima sobre la barra de estadísticas en escritorio -> ARREGLADO 6ad04a5 (re-QA v2-24b PASA; DT reprodujo en 1280/768/375)
- [x] P-20261124-0715-2 (baja) HALLAZGO: EXP-1 — A 320 px, "DISPONIBILIDAD" toca el borde de su celda -> BACKLOG BUGS.md #13 (preexistente: padding de la celda, se ve y no se corta)
- [x] P-20261124-0715-3 (media) HALLAZGO: EXP-2 — A 768 px, "INICIAR SESIÓN →" se encima sobre COMODIDAD y DISPONIBILIDAD -> ARREGLADO 6ad04a5 (misma causa que P-20261124-0715-1)
- [x] P-20261124-0715-4 (baja) HALLAZGO: EXP-3 — Mensaje de error de login en inglés crudo -> BACKLOG BUGS.md #13 (preexistente: authError.message de Supabase sin traducir)
- [x] P-20261124-0715-5 (baja) HALLAZGO: EXP-4 — Pie de login y signup se corta en dos líneas en 375 px -> BACKLOG BUGS.md #13 (preexistente, decorativo)
- [x] P-20261124-0715-6 (media) CONSOLA: Failed to load resource: the server responded with a status of 400 () (/auth/v1/token) -> DESCARTADO esperado: es la contrasena incorrecta pedida en QA-05

## 2026-11-24 07:28 - v2-24b - commit 6ad04a5 - PASA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-24b
- Sin pendientes nuevos.

## 2026-11-24 07:40 - v2-25 - commit da40141 - FALLA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-25
- [x] P-20261124-0740-1 (alta) FALLA: QA-01 — Elementos encimados y bloque vacío en la landing -> DESCARTADO no es regresion de v2-25 (diff solo agrega tokens): superposicion = comportamiento con landing_hero_mobile_bar apagado, corregido en v2-24 tras el flag; "UNIRSE AL CLUB" oscuro es el diseno original; tarjeta vacia sin asset ya conocida
- [x] P-20261124-0740-2 (alta) FALLA: QA-02 — Botones principales del dashboard sin estilo -> DESCARTADO no es regresion de v2-25: preexistente en produccion, BUGS.md #12 (Button.tsx pisa className); se corrige en v2-26
- [x] P-20261124-0740-3 (baja) HALLAZGO: EXP-1 — Catálogo de ejercicios sin imágenes -> DESCARTADO conocido: GIFs del catalogo con placeholder por decision de Pablo (CONTEXT 2026-11-22, videos en backlog)

## 2026-11-24 08:00 - v2-26 - commit d81b735 - PASA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-26
- [x] P-20261124-0800-1 (baja) HALLAZGO: EXP-1 — Inconsistencia de peso tipográfico en botones naranjos grandes -> BACKLOG BUGS.md #13 (los className de cada llamado fijan pesos distintos; unificar al migrar a shadcn)
- [x] P-20261124-0800-2 (baja) HALLAZGO: EXP-2 — Tema claro: texto de botones naranjos -> DESCARTADO sin defecto: el tema claro usa text-surface-900 = blanco por diseno de tokens (v2-20); legible
- [x] P-20261124-0800-3 (baja) HALLAZGO: EXP-3 — Cabecera pegajosa tapa el indicador de paso en la evaluación -> BACKLOG BUGS.md #13 (preexistente: al cambiar de paso no hace scroll al indicador)

## 2026-11-24 10:28 - v2-27 - commit 59ffa0b - PASA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v2-27
- [x] P-20261124-1028-1 (media) HALLAZGO: EXP-1 — Login a 320 px con correo y contraseña muy largos: sin desborde -> DESCARTADO sin defecto: el agente lo marco informativo (sin desborde); el error en ingles ya esta en BUGS.md #13
- [x] P-20261124-1028-2 (media) HALLAZGO: EXP-2 — Signup a 320 px -> DESCARTADO sin defecto: informativo, sin desborde visible

## 2026-11-24 19:39 - v3-04-05 - commit 932920c - INVALIDO
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v3-04-05
- Sin pendientes nuevos.

## 2026-11-24 21:04 - v3-04-05b - commit 932920c - FALLA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v3-04-05b
- [x] P-20261124-2104-1 (media) FALLA: QA-02 — El descanso tras SERIE HECHA muestra la misma serie, no la siguiente -> ARREGLADO 638fa11 (re-QA v3-06 PASA)
- [x] P-20261124-2104-2 (baja) HALLAZGO: EXP-1 — "Serie 1 de 0" en ejercicios por tiempo -> ARREGLADO 638fa11
- [x] P-20261124-2104-3 (baja) HALLAZGO: EXP-2 — "Saltar" no hace nada en la pantalla de repeticiones -> ARREGLADO 638fa11
- [x] P-20261124-2104-4 (baja) HALLAZGO: EXP-3 — Errores de consola en el resumen -> ARREGLADO 638fa11
- [x] P-20261124-2104-5 (media) HALLAZGO: Sin hallazgos -> DESCARTADO sin defecto: el agente no encontro mas hallazgos
- [x] P-20261124-2104-6 (media) CONSOLA: IntlError: FORMATTING_ERROR: The intl string context variable "name" was not provided to the string "¡Buen trabajo, {name}!" -> ARREGLADO 638fa11 (t.raw en los saludos; re-QA sin IntlError)

## 2026-11-24 21:31 - v3-06 - commit 638fa11 - PASA
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v3-06
- [x] P-20261124-2131-1 (baja) HALLAZGO: EXP-1 — Plural incorrecto "1 ejercicios" / "1 exercises" en el resumen del día -> BACKLOG plural "1 ejercicios" (baja, texto)
- [x] P-20261124-2131-2 (baja) HALLAZGO: EXP-2 — Entrar desde /en/login redirige a /es/dashboard (qa.intermedio) -> BACKLOG redireccion /en/login -> /es/dashboard (baja; revisar en el slice de i18n)
- [x] P-20261124-2131-3 (baja) HALLAZGO: EXP-3 — Etiqueta "Tema" en español dentro de /en/settings -> BACKLOG etiqueta "Tema" sin traducir en /en/settings (baja)
- [x] P-20261124-2131-4 (media) HALLAZGO: Modo Manual en el descanso: no probado -> DESCARTADO no probado en esa corrida; Manual cubierto en QA-03 de v3-04-05b (PASA)

## 2026-11-24 22:03 - v3-07 - commit a05766b - BLOQUEADO
- Evidencia: C:\Users\pablo\Documents\no-gym-club\_dt\qa\v3-07
- [x] P-20261124-2203-1 (media) HALLAZGO: EXP-1 — Cerrar y reabrir en el RPE retoma -> DESCARTADO sin defecto: retoma el RPE (comportamiento esperado)
- [x] P-20261124-2203-2 (media) HALLAZGO: EXP-2 — /en -> DESCARTADO sin defecto: /en correcto
- [x] P-20261124-2203-3 (media) HALLAZGO: EXP-3 — Tema claro -> DESCARTADO sin defecto: tema claro legible
- [x] P-20261124-2203-4 (media) HALLAZGO: EXP-4 — Carga lenta, no es un defecto -> DESCARTADO carga lenta del servidor de desarrollo, no es defecto
