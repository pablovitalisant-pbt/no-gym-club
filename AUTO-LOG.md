# AUTO-LOG — No Gym Club

Registro de slices ejecutados en Modo PowerShell (Director → Programador). Una entrada por slice.

| Fecha | Slice | Programador | Resultado | Commit | Notas |
|-------|-------|-------------|-----------|--------|-------|
| 2026-11-21 | v2-01 catálogo solo calistenia + retiro GIFs | deep (USD 1.16, 40 turnos) | tsc 0, vitest 305/305, build 0; lint no ejecutable (sin config ESLint, preexistente). --apply por DT: 297 inactivos, 0 gifs (verificado SQL) | eaa9ce4 | Fase E UI diferida al barrido del slice v2-02 (entorno QA aún no existe) |
| 2026-11-21 | v2-03a assessment v2 datos (migracion 0010, validadores, deriveStartLevel) | deep (USD 1.42, 48 turnos) | tsc 0, lint 0 (agrega .eslintrc.json), vitest 332/332; migracion aplicada por DT via Supabase | (este commit) | ~550 lineas (excede 200, mayormente tests); sin UI, Fase E no aplica |
| 2026-11-21 | v2-03b assessment v2 UI (5 pasos: perfil+historial, equipo sin mancuernas, salud, cardio, PAR-Q) | deep (USD 2.12) | tsc 0, lint 0, vitest 344/344, build 0 | (este commit) | Fase E pendiente: entorno QA (v2-02) |
| 2026-11-21 | v2-04a corpus Overcoming Gravity (38 docs parafraseados + seed script) | deep (USD 2.29) | tests verdes; DT verificó parafraseo (4/38 docs con frases genéricas de 8 palabras, sin copia de párrafos) | (este commit) | --apply FALLÓ: modelo NVIDIA nv-embedqa-e5-v5 retirado (410 Gone) → Bug #9 |
| 2026-11-21 | v2-bug9 embeddings: modelo nemotron-3.5-embed-1b (1024d) + reembed-all | deep (USD 1.22) | tests verdes; DT re-embebió 50 corpus + 616 ejercicios | (este commit) | BUGS.md #9 |
| 2026-11-21 | v2-bug9b reintentos 429/5xx en NVIDIA | deep (USD 0.73) | 361/361 | (este commit) | 502 transitorio cortó el primer reembed |
| 2026-11-21 | v2-03c meta particular (focus_areas) | deep (USD 1.28) | tsc/lint/test/build 0; migración 0011 aplicada | (este commit) | R9 |
| 2026-11-21 | v2-02 entorno QA (qa-entorno.json, qa-preparar, barrido) | codex (666k in/626k cache, 6.7k out) | lint/tsc 0; sandbox de Codex no pudo correr vitest ni preparar → DT los corrió: 3 cuentas creadas; DT corrigió barrido (rutas) | (este commit) | Excepción Opción A (Pablo 23:36) |
| 2026-11-21 | v2-04b modelo de datos del plan (0012, tipos, dayInfo/completeDay/validatePhase) | deep (USD 1.26) | 400/401 (falla ajena de qa-entorno, corregida por DT); migración 0012 aplicada | (este commit) | |
| 2026-11-22 | v2-05 generador de fase (build-phase-prompt + /api/generate-phase) | deep (USD 1.87) | tsc/lint 0, 418 tests, build 0 (DT) | (este commit) | ~487 lineas prod (excede 200); respuesta llega al final (2 llamadas DeepSeek posibles) dentro del limite de 300 s de Vercel Fluid; medir en prueba real |
| 2026-11-22 | QA Fase E assessment v2 (Codex) | codex | QA-02..05 PASA; QA-01 vuelta atras no verificada (por codigo el estado vive en el padre); 2 hallazgos (P-0006-1 media, P-0006-2 baja) -> fix en curso | - | 1a corrida BLOQUEADA: preparar sin env (corregido con --env-file) y 500 por vitest escribiendo feature-flags.json mientras el server QA corria |
| 2026-11-22 | fix QA assessment (rangos edad/peso/altura, maxLength 300) | deep (USD 1.50) | 427 tests, build 0 | (este commit) | cierra P-20261122-0006-1/-2 |
| 2026-11-22 | v2-05b ajuste generador (variante inicial segun test, pool de fundamentos, 3 dias por defecto) | deep (USD 1.30) | 431 tests, build 0 | (este commit) | Evidencia: prueba real DT fase 0 extremo/intermedio, 165 s y 158 s, 200 OK |
| 2026-11-22 | v2-06a dashboard v2 (dia actual, nav, completar, crear programa) | deep (USD 2.08) | 452 tests, build 0 | (este commit) | flag training_plan_v2 false; QA pendiente |
| 2026-11-22 | fix tests no escriben feature-flags.json real (FEATURE_FLAGS_PATH) | deep (USD 0.83) | 455/455 x2, hash del archivo real intacto | (este commit) | habilita QA en paralelo con el Programador |
| 2026-11-22 | v2-06b calendario 84 dias + ?day= | deep (USD 1.21) | 461 tests, build 0 | (este commit) | DT re-probo generador: extremo recibe push-up (wall), 3 dias, caminata 7 min (119 s) |
| 2026-11-22 | v2-07 runner alimentado por el dia del plan (startPlanSession, finisher/cardio, completar al guardar RPE) | deep (USD 2.07) | 474 tests, build 0 | (este commit) | flag plan_session_runner false |
| 2026-11-22 | v2-08 fase siguiente con logs (summarizePhaseLog, 409 sin fase previa, tarjeta de fase N+1) | deep (USD 2.16) | 488 tests, build 0 (DT) | (este commit) | enriquecimiento con logs tras flag phase_generation_evidence_adjustment |
| 2026-11-22 | QA Fase E plan v2 (Codex, flags training_plan_v2+plan_session_runner+phase_generation) | codex | QA-01,03,04,05,06 PASA (generacion real en UI, puntero, calendario, sesion completa con RPE); QA-02 FALLA descartada: caso mal escrito por el DT (7 avances, no 8) | - | hook pre-commit instalado |
