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
