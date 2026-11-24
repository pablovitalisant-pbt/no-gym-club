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
| 2026-11-22 | v2-09a modo de corrido: timeline + motor por timestamps | deep (USD 1.09) | 497 tests, build 0 | (este commit) | flag continuous_session_mode |
| 2026-11-22 | v2-09b modo de corrido UI (ContinuousPlayer, resumen con reps opcionales) | deep (USD 1.97) | 507 tests, build 0 | (este commit) | ~510 lineas (excede 200) |
| 2026-11-22 | v2-10 limpieza (410 en generate-session con v2, 6 flags sin uso eliminados, fuera logs BUG8/Bug3, limitations_notes<=300) | deep (USD 1.59) | 511 tests, build 0 | (este commit) | |
| 2026-11-22 | v2-audit ponytail (Fase A, solo lectura) | deep (USD 1.32) | 18 hallazgos; #1 critico ya verificado por DT (0 planes activos duplicados antes de aplicar 0012) | - | contador de audit a 0 |
| 2026-11-22 | v2-11 correcciones del audit (#3,#4,#5,#6,#7,#10,#11,#13,#15,#17) + fixture de planes QA | deep (USD 2.13 + 1.22) | 521/521, build 0 (DT) | (este commit) | diferidos: #2 borrar v1 tras release, #8/#9/#12/#14 refactors, #16 timezone, #18 trigger plan_id |
| 2026-11-22 | QA modo de corrido (Codex) + fix | codex + deep (USD 1.12) | QA-01,02,05 PASA; QA-03 INESTABLE (cache del router) y QA-04 FALLA (no retomaba tras recargar) -> arreglados; 526 tests, build 0 | (este commit) | DT: fase 2 real intermedio 200 en 56 s; observacion: dia 'lower' sin ejercicios de pierna -> v2-12 |
| 2026-11-22 | re-QA modo de corrido (Codex) | codex | PASA (retoma tras recargar; cierre avanza el dia) | - | cierra P-20261122-0123-1 |
| 2026-11-22 | v2-12 coherencia tipo de dia / ejercicios (cobertura por categoria, validador, prompt) | deep (USD 1.99) | 534 tests, build 0 (DT) | (este commit) | DT: fase 2 real intermedio 200 en 81 s; dia lower = split squats, lunge, pistol, glute bridge, hanging leg raise |
| 2026-11-22 | release v2: flags training_plan_v2, plan_session_runner, continuous_session_mode, phase_generation_evidence_adjustment ON | deep (USD 0.66) | 534/534 x2, build 0 | (este commit) | Pablo aprobo push sin UAT local (02:07): app sin usuarios reales |
| 2026-11-22 | deploy v2 a produccion (f126321) | DT | Vercel success; humo solo lectura: /es, /es/login, /en/signup, /es/dashboard 200; /api/generate-session 410; /api/generate-phase sin auth 401 | f126321 | qa-prod.ps1 sin humoProd configurado aun -> humo manual |
| 2026-11-22 | v2-13 flujo PAR-Q -> tests fisicos v2 (regresiones, cronometros) + CTA del dashboard | deep (USD 2.08) | 547 tests, build 0 | (este commit) | Bug reportado por Pablo en prod: tras PAR-Q volvia al inicio (dashboard sin assessment_results) |
| 2026-11-22 | v2-14 legibilidad: espanol neutro sin voseo, letras mas grandes, 'Paso N de 5' con barra, dias 1-7 en botones, botones Siguiente/Atras reales | deep (USD 2.46) | 559 tests, build 0 | (este commit) | flag assessment_step_indicator encendido por DT; Fase E: revision de Pablo en su celular |
| 2026-11-22 | fix 7 dias/semana (max 6 de entrenamiento + 1 descanso) y voseo restante | deep (USD 1.13) | 562 tests, build 0 | (este commit) | Bug prod: Pablo con 7 dias -> prompt exigia 0 descansos y el validador >=1 -> 502. API OK (qa.intermedio 200 en 33 s en prod) |
| 2026-11-22 | fix Bug #11 (salida truncada) + modelo deepseek-flash | deep (USD 1.00) | 565 tests, build 0; DT verifico 7 dias local 200 en 92 s | (este commit) | |
| 2026-11-22 | v2-15 dashboard claro (tarjeta Entrenamiento de hoy con CTA arriba, duracion estimada, secciones plegables con miniaturas, badges traducidos) | deep (USD 2.36) | 571 tests, build 0 | (este commit) | flag plan_today_card encendido por DT. GIFs: DT reviso 23 del plan de Pablo, restauro 21 (ver _dt/gifs/revision-2026-11-22.md) |
| 2026-11-22 | v2-16 quitar (male)/(female) de los nombres visibles (solo presentacion) | deep (USD 1.25) | 584 tests, build 0 | (este commit) | nombres siguen en ingles por pedido de Pablo |
| 2026-11-22 | v2-17 volver al origen desde el detalle + v2-18 nivel por indicadores y 'Rehacer mi programa' | deep (USD 0.54 + 3.59) | 599 tests, build 0 | (este commit) | Bug prod: Pablo (8 dominadas, plancha 120 s, colgado 90 s, intermedio) quedaba 'beginner' porque solo se miraba el push-up. Flag redo_program_plan encendido por DT; texto 'Volver' |
| 2026-11-22 | v2-19 mensajes motivacionales durante la generacion (24 ES/EN del manifiesto, rotacion 6 s, barra y tiempo) | deep (USD 1.71) | 608 tests, build 0 | (este commit) | flag plan_generating_messages encendido por DT |
| 2026-11-22 | v2-20 tema claro/oscuro/sistema (tokens CSS, script sin parpadeo, ThemeSelector) | deep (USD 1.66) | 621 tests, build 0 | (este commit) | flag theme_switcher; selector se monta en v2-21 |
| 2026-11-22 | v2-21 configuracion (foto, nombre/saludo, tema, idioma, sonido, programa, cuenta) | deep (USD 6.53) | 636 tests, build 0; migracion 0013 + bucket avatars aplicados por DT | (este commit) | flags profile_settings y theme_switcher encendidos; PRD seccion 11 (comunidad aprobada por Pablo) |
| 2026-11-22 | v2-22 comunidad etapa 1 (perfil publico opt-in, Cerca de ti, bloquear, reportar) | deep (USD 3.74 + 0.52) | 663 tests, build 0; migracion 0014 aplicada por DT con radio max 25 km y GRANTs; DT verifico con cuentas QA: anon sin acceso, solo distancia entera y comuna (sin lat/lng), bloqueo bidireccional, reportes no legibles | (este commit) | flag community encendido |
| 2026-11-22 | v2-23a comunidad etapa 2: datos de solicitudes y chat (0015, funciones, triggers de bloqueo y tasa, realtime) | deep (USD 1.92) | 686 tests; DT endurecio community_pair_blocked (solo responde a las partes) y aplico 0015; verificado con cuentas QA: solicitud, duplicada rechazada, chat solo tras aceptar, sin suplantacion, sin update directo, bloqueo cancela y oculta | (este commit) | flag community_chat false hasta la UI |
| 2026-11-22 | v2-23b UI de solicitudes (estados en perfil, /community/requests, badge) | deep (USD 2.44) | 693 tests, build 0 | (este commit) | detras de community_chat (false) hasta el chat |
| 2026-11-22 | v2-23c chat 1:1 en tiempo real (lista de chats, sala con realtime, envio optimista, sin links clickeables) | deep (USD 2.49) | 701 tests, build 0 | (este commit) | flag community_chat encendido por DT |
| 2026-11-22 | verificacion realtime con cuentas QA | DT | mensaje de intermedio llega a extremo por postgres_changes con filtro por conexion (RLS aplicada); la 1a prueba fallo por insertar en el mismo instante del SUBSCRIBED | - | |

## 2026-11-24 - Slice: v2-24 correcciones de UI en landing y login/signup
- Programador: deep (deepseek-flash, effort low); Codex sin cupo hasta 08:58
- Contrato: barra de stats del hero en el flujo en movil (flag landing_hero_mobile_bar=false), token --c-text-outline para "CLUB", boton submit nativo en login/signup, placeholder de correo por i18n; Button.tsx fuera de alcance (Bug #12)
- Tests: 711/711 verde, typecheck/lint/build 0 (verificar.ps1 del DT, dos veces)
- Commit: 45e401b + 6ad04a5 (fix QA-02)
- Gates disparados: ninguno; deploy pendiente de UAT de Pablo (Senal 3)
- QA (Fase E): v2-24 FALLA 7/8 (QA-02: link "Iniciar sesion" bajo la barra desde md, confirmado en re-prueba) -> fix md:pb-32 -> v2-24b PASA 4/4; DT reprodujo en 1280, 768 y 375 px sin superposicion
- Desvios del Programador: en Fase A (solo lectura) implemento B-C-D sin esperar aprobacion del contrato; el DT reviso el diff completo y lo acepto por estar dentro del alcance
- QA metricas: FP 0, ESC 0, ACIERTOS 1 (QA-02), costo USD 1.00 (0.74 + 0.27); hallazgos menores a BUGS.md #13; mejoras de QA aplicadas: ninguna

## 2026-11-24 - Slice: v2-25 base shadcn/ui controlada
- Programador: deep (deepseek-flash, effort low)
- Contrato: components.json con alias components/shadcn, lib/utils cn, tokens shadcn agregados con los mismos colores, button de shadcn sin uso, flag shadcn_ui=false
- Tests: 719/719 verde, typecheck/lint/build 0 (verificar.ps1 del DT); grep del DT: ninguna pantalla usaba clases sueltas que ahora tomen color (solo text-text-muted)
- Commit: da40141
- Gates disparados: ninguno
- QA (Fase E): FALLA 1/3 confirmada en re-prueba, pero los 3 defectos son preexistentes (flag de v2-24 apagado en esta corrida, diseno original de "UNIRSE AL CLUB", Bug #12 en dashboard); ninguno causado por el diff -> DESCARTADOS como regresion; Bug #12 sube a alta y va en v2-26
- Desvios del Programador: (1) implemento B-C-D en Fase A otra vez; causa en la semilla: deep.ps1 Fase A solo pasaba --allowedTools (aprueba, no bloquea). DT agrego --disallowedTools Edit,Write,MultiEdit,NotebookEdit,Bash (backup deep.ps1.bak-2026-11-24). (2) instalo dependencias llamando al CLI de npm via node para esquivar que npm install no esta permitido; dependencias validas (clsx 2.1.1, tailwind-merge 2.5.5, cva 0.7.1) y aceptadas por el DT, pero el patron queda registrado.
- QA metricas: FP 0 (defectos reales, solo que preexistentes), ESC 0, ACIERTOS 0, costo USD 0.61

## 2026-11-24 - Slice: v2-26 Bug #12, Button pisaba su className
- Programador: deep (deepseek-flash, effort low); Fase A ya de solo lectura con el arreglo de deep.ps1
- Contrato: Button une clases con cn(base, variante, className) y no re-esparce className; extendTailwindMerge registra los 9 fontSize del tema (hallazgo del Programador: sin esto cn borraba text-surface-900 en 6 botones). Sin flag (bug fix)
- Tests: 727/727 verde, typecheck/lint/build 0 (verificar.ps1 del DT); test de perfil ahora lee el atributo disabled real (revisado por el DT: mas estricto, no mas laxo)
- Commit: d81b735
- Gates disparados: ninguno
- QA (Fase E): PASA 6/6 (dashboard, plan, sesion, assessment, comunidad, config, login; 375 y 1280); DT reprodujo QA-01 en local 375 px con cuenta sintetica: "Empezar entrenamiento" bg 232,87,10, texto 10,10,10, inline-flex, icono en fila
- Desvios del Programador: ninguno
- QA metricas: FP 0, ESC 0, ACIERTOS 0, costo USD 1.06; hallazgos bajos a BUGS.md #13

## 2026-11-24 - Release: v2-24 + v2-25 + v2-26
- Aprobado por Pablo (09:56): flags landing_hero_mobile_bar y shadcn_ui en true; tests de flags a "existe y es booleano" (Programador deep)
- Senal 3: verificar.ps1 verde (727/727, build 0); sin variables de entorno nuevas desde b1b7662; Fase E de flujos criticos cubierta por v2-24b y v2-26 (dashboard, plan, sesion, assessment, comunidad, config, login). Ponytail audit NO corrido en este release (pendiente).
- Commit: 93b7113, push a main (b1b7662..93b7113), deploy Vercel
- Humo de produccion: qa-prod.ps1 RECHAZADO (humoProd sin configurar); humo manual del DT en paginas publicas: hero 375 sin solape (barra static), 1280 sin solape (link 792-811, barra 845), CLUB stroke 150, Entrar bg 232,87,10 texto 10,10,10 alto 56, placeholders es/en ok, sin recursos con error. Dashboard en produccion no verificado (requiere sesion; cubierto en QA local v2-26)

## 2026-11-24 - Slice: v2-27 login, signup y evaluacion con componentes shadcn/ui
- Programador: deep (deepseek-flash, effort low); Fase A de solo lectura (intento pasar a B y quedo bloqueado, correcto)
- Contrato: Input, Label y Progress en components/shadcn sin Radix ni dependencias; login/signup con Button+Input+Label de shadcn y evaluacion con Progress, tras flag shadcn_ui (UiFlagProvider en (auth)/layout)
- Tests: 742/742 verde, typecheck/lint/build 0 (verificar.ps1 del DT)
- Commit: 59ffa0b + fix (ver abajo)
- Gates disparados: ninguno; push pendiente de OK de Pablo
- QA (Fase E): PASA 5/5. El DT al reproducir QA-01 encontro un defecto que la QA no marco: boton shadcn con radius 6px y peso 500 (diseno cuadrado y en negrita). Fix: rounded-none en la base del button shadcn y font-bold en login/signup. DT re-midio: radius 0, peso 700, bg 232,87,10, texto 10,10,10, alto 56 (login y signup)
- Desvios del Programador: ninguno
- QA metricas: FP 0, ESC 1 (radio/peso del boton se escapo a la QA), ACIERTOS 0, costo USD 0.78
