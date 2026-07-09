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

## Bug #3: Generación de sesión falla con "invalid-json"
- **Fecha**: 2026-07-09 (diagnóstico corregido 2026-07-09)
- **Clasificación**: P = Plataforma (Vercel + Next.js Route Handler runtime behavior)
- **Causa raíz**: `export const maxDuration = 60` en `app/api/generate-session/route.ts` forza la función al runtime Node.js Serverless (Lambda) de Vercel. Sin `maxDuration`, la función usaba el runtime por defecto donde el streaming vía `ReadableStream` + `Response(stream)` funciona sin bufferizar. Con `maxDuration`, Vercel despliega la función como Serverless Function con 60s de timeout, pero el `Response(stream)` se bufferiza internamente — el cliente no recibe chunks incrementales sino el body completo al final. Si DeepSeek cierra la conexión antes de generar el JSON completo (por inactividad, no por timeout de Vercel), el buffer se entrega truncado y el `JSON.parse` en el cliente falla con "invalid-json". El logging de diagnóstico lo confirmó: 3493 caracteres cortados a mitad de un string. Se descartó la hipótesis de timeout de Vercel (la función con `maxDuration` tenía 60s, DeepSeek respondió en ~22s). El problema no es tiempo de ejecución — es que el runtime Node.js Serverless de Vercel no maneja `ReadableStream` como streaming real.
- **Solución**: Se eliminó `export const maxDuration` de la ruta. La función vuelve al runtime por defecto donde el streaming funciona correctamente. Si en el futuro se necesita extender el timeout, debe hacerse sin forzar el runtime Node Serverless — investigar `export const runtime = 'edge'` o mantener el runtime por defecto. Fluid Compute se mantiene habilitado a nivel de proyecto de Vercel. El logging de diagnóstico y los `console.time` se mantienen (bajo costo, útiles si el bug reaparece).
