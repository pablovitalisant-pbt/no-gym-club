# BUGS
Registro de bugs resueltos. Una entrada por bug, completada en Fase 6 del protocolo PBT-IA-DEBUGGING.

## Bug #1: Cuestionario RPE no mostrado al finalizar la sesión
- **Fecha**: 2026-07-08
- **Clasificación**: G = Regresión / Flujo de UI
- **Causa raíz**: `SessionRunner` (`session-runner.tsx`) no integraba el componente `LogForm` en el estado `state === 'done'`, por lo que el usuario no podía registrar el RPE ni las notas, y la sesión no se guardaba como completada (el campo `completed_at` se quedaba en NULL). Al volver al Dashboard, el estado se reseteaba y se perdía la referencia de la sesión.
- **Solución**: Se importó `LogForm` y se renderizó directamente en la pantalla de finalización del runner. Al guardar con éxito el RPE, se redirige al usuario al Dashboard tras 1.5 segundos.

## Bug #2: Flujo de sesión congelado tras ejercicio sin descanso prescrito
- **Fecha**: 2026-07-09
- **Clasificación**: G = Regresión / Flujo de UI
- **Causa raíz**: En `handleDone()` y `handleConfirmReps()` (`session-runner.tsx`), la rama que avanza al siguiente ejercicio cuando **no** hay `rest_seconds` prescrito solo ejecutaba `setIndex((i) => i + 1)` sin volver el `state` a `'active'`. Los ejercicios de `cooldown` (estiramientos) nunca tienen `rest_seconds` asignado por el prompt de IA, por lo que al terminar el primer estiramiento la pantalla quedaba congelada en el render de `state === 'timing'` con el cronómetro en 0 y sin botón interactivo.
- **Solución**: Se agregó `setState('active')` antes de `setIndex((i) => i + 1)` en ambas ramas (`handleDone` línea 151, `handleConfirmReps` línea 179), replicando el comportamiento correcto que ya tenía `handleSkipRest()`.

## Bug #4: Generación de sesión falla con "invalid-json" (recurrencia, causa distinta a Bug #3)
- **Fecha**: 2026-07-11
- **Clasificación**: C = Integración externa (DeepSeek API)
- **Síntoma**: Idéntico al Bug #3 en apariencia (`invalid-json` en la UI), pero el Bug #3 seguía resuelto (`maxDuration` seguía sin usarse). Se disparó recién al guardarse la primera sesión completada (`completed_at` no nulo), lo que activa `sessionHistory` en el prompt.
- **Causa raíz**: `lib/deepseek/client.ts` llama a `deepseek-v4-flash` sin pasar `extra_body: { thinking: ... }`. Según la documentación oficial de DeepSeek, el modo *thinking* está activo por defecto con `reasoning_effort: high`, y el razonamiento (`reasoning_content`) se genera antes del `content` final, consumiendo del mismo presupuesto de `max_tokens`. Con `maxTokens: 2048` y un prompt más complejo (historial + reglas de adaptación), el modelo agotó el presupuesto completo en razonamiento interno sin nunca emitir contenido: confirmado con `finish_reason: length` y `raw length: 0` en logs de Vercel.
- **Diagnóstico**: Se instrumentó `streamChatCompletion` para loguear `finish_reason` por chunk antes de aplicar cualquier fix. El primer log post-instrumentación confirmó `finish_reason: length` con `raw length: 0`, descartando la hipótesis inicial (JSON parcialmente generado, como en Bug #3) y señalando agotamiento total del presupuesto en la fase de razonamiento.
- **Restricción de negocio**: no se desactivó el modo *thinking* — es requisito de producto que el modelo razone sobre el estado físico y la adaptación del usuario antes de generar la sesión.
- **Solución**: `maxTokens` subido de `2048` a `8192` en ambos modos (streaming y no-streaming) de `generate-session/route.ts`. Se agregó captura de `reasoning_content` en el stream (acumulado, no expuesto al usuario) y verificación explícita de `finish_reason === 'length'` en ambas funciones de `client.ts` — si vuelve a truncarse, falla con error explícito (`DeepSeek output truncated: max_tokens reached before completion`) en vez de silenciarse en un `JSON.parse` vacío.
- **Verificado**: build y `tsc --noEmit` corridos independientemente por Director Técnico. Generación en producción confirmada exitosa: sin `finish_reason: length`, sin `invalid-json`, sesión guardada. Tiempo de generación subió de ~20-22s a 40s (razonamiento completo dentro del nuevo presupuesto, esperado).
- **Zona de riesgo**: si el prompt crece más (más historial, más corpus RAG), 8192 podría volver a ser insuficiente. El log de `reasoning_content.length` ante un truncamiento futuro da el dato real para recalibrar en vez de adivinar.

## Bug #5: Estado del runner de sesión perdido al cambiar de app, recargar o navegar atrás
- **Fecha**: 2026-07-24
- **Clasificación**: G = Regresión / Flujo de UI
- **Síntoma**: Al cambiar de app (background), recargar la página o presionar atrás desde el runner, la sesión se reiniciaba al estado `idle` — el progreso (ejercicio actual, reps registradas, descansos cursados, contador de timer) se perdía por completo.
- **Causa raíz**: Todo el estado del runner (`state`, `index`, `restSeconds`, `timingSeconds`, `exerciseLogRef`, `restTimesRef`) vivía exclusivamente en memoria de React (useState + useRef). No había ningún mecanismo de persistencia. Los cronómetros usaban contadores relativos (`setRestSeconds(prev => prev - 1)`) que se congelan al pausarse el intervalo en background — al volver, el contador continuaba desde donde se pausó, no desde el tiempo real transcurrido.
- **Sub-bugs descubiertos durante verificación independiente** (ninguno reportado por el reporte inicial de Claude Code):
  - **5a**: `restEndsAtRef`/`timingEndsAtRef` nunca se reseteaban a `null` tras consumirse. Si un rest precedía a un timing, el snapshot guardado durante timing tenía un `restEndsAt` viejo, y la restauración (que decidía por `!= null` del timestamp) entraba en la rama de rest en vez de timing.
  - **5b**: Faltaban `saveSnapshot` en las ramas de avance simple de `handleDone`, `handleSkipRest` y `handleConfirmReps` (ejercicios sin rest_seconds ni duration_seconds).
  - **5c**: Import de `beforeEach` faltante en test (detectado por `tsc --noEmit`, no por vitest que usa globals).
- **Solución**:
  - Nueva función `lib/session/runner-persistence.ts`: `saveSnapshot`, `loadSnapshot`, `clearSnapshot` con key `ngc-runner:<sessionId>` y umbral de expiración de 6h.
  - Cronómetros pasados a timestamps absolutos (`restEndsAt`, `timingEndsAt`) con cálculo derivado de segundos restantes.
  - `useEffect` de restauración al montar con catch-up de timers vencidos en background.
  - `saveSnapshot` en los 6 puntos estructurales de la máquina de estados (startRest, handleStartTimer, handleConfirmReps, handleDone advance, handleSkipRest advance, confirmReps advance).
  - Guards de restauración por `snapshot.state` en vez de solo `!= null`.
  - Reseteo de refs a `null` en los 6 puntos de consumo (expiración rest/timing, skipRest, catch-up).
  - `clearSnapshot` al llegar a `state === 'done'` junto al flush a DB.
- **Zona de riesgo**: localStorage es por navegador/dispositivo. Cambiar de navegador o borrar datos del sitio pierde el snapshot. Lo ya confirmado en DB (reps y rest times) no se pierde — solo el "dónde iba". Si se necesita compartir estado entre dispositivos en el futuro, migrar a un servicio remoto (ej. Supabase realtime).

## Bug #3: Generación de sesión falla con "invalid-json"
- **Fecha**: 2026-07-09 (diagnóstico corregido 2026-07-09)
- **Clasificación**: P = Plataforma (Vercel + Next.js Route Handler runtime behavior)
- **Causa raíz**: `export const maxDuration = 60` en `app/api/generate-session/route.ts` forza la función al runtime Node.js Serverless (Lambda) de Vercel. Sin `maxDuration`, la función usaba el runtime por defecto donde el streaming vía `ReadableStream` + `Response(stream)` funciona sin bufferizar. Con `maxDuration`, Vercel despliega la función como Serverless Function con 60s de timeout, pero el `Response(stream)` se bufferiza internamente — el cliente no recibe chunks incrementales sino el body completo al final. Si DeepSeek cierra la conexión antes de generar el JSON completo (por inactividad, no por timeout de Vercel), el buffer se entrega truncado y el `JSON.parse` en el cliente falla con "invalid-json". El logging de diagnóstico lo confirmó: 3493 caracteres cortados a mitad de un string. Se descartó la hipótesis de timeout de Vercel (la función con `maxDuration` tenía 60s, DeepSeek respondió en ~22s). El problema no es tiempo de ejecución — es que el runtime Node.js Serverless de Vercel no maneja `ReadableStream` como streaming real.
- **Solución**: Se eliminó `export const maxDuration` de la ruta. La función vuelve al runtime por defecto donde el streaming funciona correctamente. Si en el futuro se necesita extender el timeout, debe hacerse sin forzar el runtime Node Serverless — investigar `export const runtime = 'edge'` o mantener el runtime por defecto. Fluid Compute se mantiene habilitado a nivel de proyecto de Vercel. El logging de diagnóstico y los `console.time` se mantienen (bajo costo, útiles si el bug reaparece).

## Bug #6: PWA no se abre en pantalla completa (barra de direcciones visible)
- **Fecha**: 2026-07-24
- **Clasificación**: F = Feature ausente (no era una regresión de código — nunca existió configuración de PWA)
- **Causa raíz**: no existía `manifest.json`/`manifest.ts`, ni meta tags de `viewport`/`appleWebApp`, ni íconos, en ningún punto del repo. El sitio funcionaba como página web normal, nunca como PWA instalable.
- **Solución**: `app/manifest.ts` (name, icons 192/512/512-maskable, `display: standalone`, colores de marca), íconos generados desde `Logo_512.png`, exports `metadata`/`viewport` en `app/[locale]/layout.tsx`.
- **Zona de riesgo**: sin Service Worker — decisión de alcance explícita, no hay soporte offline ni `beforeinstallprompt`. El ícono `maskable` no tiene padding de zona segura; si se ve recortado en Android es un ajuste de imagen, no de código.

## Bug #7: Script de importación de catálogo no trae ejercicios nuevos
- **Fecha**: 2026-07-24
- **Clasificación**: C = Integración externa (oss.exercisedb.dev)
- **Causa raíz**: el nextCursor que devuelve la API de ExerciseDB no avanza entre páginas — página 1 y página 2 devuelven idéntico resultado (verificado con llamada manual, cursor `17lJ1kr` repetido). El script itera 60 veces sobre la misma página de ~25 ejercicios, todos ya existentes en el catálogo, resultando en 0 inserciones.
- **Estado**: resuelto 2026-07-24.
- **Solución**: se migró de la API paginada `oss.exercisedb.dev` (cursor roto) al dataset estático `https://github.com/hasaneyldrm/exercises-dataset` — 1,324 ejercicios en un solo archivo JSON, licencia MIT. Nuevo script `scripts/import-exercises-dataset.ts` que lee el JSON completo en un fetch, filtra equipment = "body weight" (325 ejercicios), dedup por `name_en` contra la DB actual, e inserta los nuevos.
- **Nota de traducción**: el dataset no tiene `name_es` — solo `name` en inglés. Las filas nuevas usan `name_es = name_en`, mismo comportamiento que las 11 filas sin traducir del catálogo actual. Las instrucciones sí están traducidas al español en `instruction_steps.es` (array de pasos), que se inserta en `instructions_es`.
- **Nota de imágenes**: las filas nuevas no tienen `gif_url` ni `image_url` — quedan en `null` hasta el futuro sourcing de imágenes.

## Bug #9: Embeddings NVIDIA caídos — modelo `nvidia/nv-embedqa-e5-v5` retirado
- **Fecha**: 2026-11-21
- **Clasificación**: C = Integración externa (NVIDIA NIM)
- **Síntoma**: `seed-corpus-og.ts --apply` → 38/38 errores `NVIDIA API error: 410 Gone`. Afecta también a producción: `getEmbedding()` falla, por lo que `search_corpus`/`search_exercises` (RAG) no funcionan.
- **Evidencia**: llamada directa a `/v1/embeddings` con el modelo → 410 "reached its end of life". NVIDIA había anunciado su deprecación para noviembre 2026. `GET /v1/models` + prueba de cada candidato: solo responden `nvidia/nemotron-3-embed-1b` (solo 2048d), `nvidia/nemotron-3.5-embed-1b` (acepta `dimensions: 1024`, query y passage) y `nvidia/nemotron-3.5-embed-8b` (4096d).
- **Causa raíz**: modelo retirado por el proveedor; el código lo tiene fijo en `lib/nvidia/client.ts`.
- **Solución**: (en curso, slice v2-bug9) migrar a `nvidia/nemotron-3.5-embed-1b` con `dimensions: 1024` (se mantiene `vector(1024)` e índices ivfflat), y re-embeber corpus y catálogo con el modelo nuevo (los vectores de modelos distintos no son comparables).

## Bug #10: 'No pudimos crear el programa' con 7 dias por semana
- **Fecha**: 2026-11-22
- **Clasificacion**: B/E = logica de negocio, visible en produccion
- **Evidencia**: mismo endpoint en prod con qa.intermedio (4 dias) 200 en 33 s; perfil de Pablo available_days_per_week=7. El prompt pedia dias de entrenamiento = dias disponibles (0 descansos) y validatePhase exige >=1 dia rest -> dos validaciones fallidas -> 502.
- **Solucion**: MAX_TRAINING_DAYS=6 en lib/plan/plan.ts; el prompt usa min(dias,6) y explica el descanso en el rationale.


## Bug #11: generate-phase 500 por salida truncada de DeepSeek
- **Fecha**: 2026-11-22
- **Clasificacion**: C = Integracion externa
- **Evidencia**: reproducido local con qa.intermedio (7 dias -> 6 de entrenamiento): log 'DeepSeek output truncated: max_tokens reached before completion' a los 79 s; en prod 500. Con 4 dias cabia en 16384.
- **Solucion**: maxTokens 49152 (doc oficial: hasta 384K de salida), notas <=140 y rationale <=600 caracteres, modelo deepseek-flash. Verificado local: 200 en 92 s, plantilla push/pull/legs x2 + descanso.


## Bug #12: Button.tsx pisa su propio className (botones sin estilo base)
- **Fecha**: 2026-11-24
- **Clasificacion**: A = visual, visible en produccion desde Slice 1c
- **Sintoma**: el boton "Entrar" del login se ve como texto suelto: fondo transparente, sin fila texto+flecha.
- **Evidencia**: en produccion (375 px) el submit del login mide `background-color: rgba(0,0,0,0)` y `display: inline-block`, con `--c-accent` definido y la regla `bg-accent` presente en el CSS. `git log -L` muestra el patron desde bc0d4ec (Slice 1c).
- **Causa raiz**: `components/ui/Button.tsx` arma `className` (base + variante + props.className) y despues hace `{...buttonProps}`, que todavia trae `props.className` y lo pisa. Todo `<Button className=...>` pierde base y variante.
- **Alcance**: ~70 usos con `className` en app/ y components/; todas esas pantallas se aprobaron con este comportamiento. Arreglarlo en el componente cambia de golpe el aspecto de toda la app (la variante por defecto pone `bg-accent`).
- **Solucion**: v2-24 corrige solo login y signup con boton nativo local. El componente se resuelve en el slice de shadcn (Button con merge de clases), migrando pantalla por pantalla con QA visual. Hasta entonces, NO usar `className` en `<Button>` esperando conservar el estilo base.
- **Solucion aplicada (v2-26)**: `Button.tsx` arma `className` con `cn(base, variante, props.className)` y ya no re-esparce `className` al `<button>`/`<a>` (un solo atributo class). En `lib/utils.ts`, `cn` usa `extendTailwindMerge` con los 9 fontSize de `theme.extend.fontSize` registrados como grupo `font-size`, para que `text-body-lg` no borre `text-surface-900`. Cubierto por `tests/v2-26-button-classname.test.tsx`.

## Bug #13: Pendientes menores de UI vistos en la QA de v2-24 (backlog)
- **Fecha**: 2026-11-24
- **Clasificacion**: A = visual / textos, preexistentes, baja severidad
- 1. Login: el error de Supabase se muestra crudo en ingles ("Invalid login credentials") en la interfaz en espanol. Mapear `authError` a claves i18n.
- 2. Hero a 320 px: "DISPONIBILIDAD" llega al borde de su celda (padding de la barra de stats).
- 3. Pie "MANUAL V4.01 — AUTH MODULE" de login/signup se parte en dos lineas a 375 px.
- 4. Botones naranjos grandes con peso de letra distinto segun el llamado (className de cada pantalla); unificar al migrar a shadcn.
- 5. Evaluacion en 375 px: al pasar de paso con la pagina desplazada, la cabecera pegajosa tapa "Paso X de 5"; hacer scroll al indicador al cambiar de paso.
