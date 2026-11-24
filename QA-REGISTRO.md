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
- [ ] P-20261124-0715-1 (media) FALLA: QA-02 — "INICIAR SESIÓN →" se encima sobre la barra de estadísticas en escritorio
- [x] P-20261124-0715-2 (baja) HALLAZGO: EXP-1 — A 320 px, "DISPONIBILIDAD" toca el borde de su celda -> BACKLOG BUGS.md #13 (preexistente: padding de la celda, se ve y no se corta)
- [ ] P-20261124-0715-3 (media) HALLAZGO: EXP-2 — A 768 px, "INICIAR SESIÓN →" se encima sobre COMODIDAD y DISPONIBILIDAD
- [x] P-20261124-0715-4 (baja) HALLAZGO: EXP-3 — Mensaje de error de login en inglés crudo -> BACKLOG BUGS.md #13 (preexistente: authError.message de Supabase sin traducir)
- [x] P-20261124-0715-5 (baja) HALLAZGO: EXP-4 — Pie de login y signup se corta en dos líneas en 375 px -> BACKLOG BUGS.md #13 (preexistente, decorativo)
- [x] P-20261124-0715-6 (media) CONSOLA: Failed to load resource: the server responded with a status of 400 () (/auth/v1/token) -> DESCARTADO esperado: es la contrasena incorrecta pedida en QA-05
