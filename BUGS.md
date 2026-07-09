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
- **Fecha**: 2026-07-09
- **Clasificación**: C = Integración externa (límite de plataforma, no error de código)
- **Causa raíz**: El pipeline completo de `/api/generate-session` (embedding NVIDIA + búsqueda de corpus en Supabase + streaming de DeepSeek + insert final) tardó 22.13s en producción, superando el límite duro de 10s del plan Hobby de Vercel sin Fluid Compute. La función se cortó a mitad del streaming; el JSON acumulado hasta ese punto quedó incompleto (confirmado con logging de diagnóstico: 3493 caracteres, cortado a mitad de un string sin llaves de cierre). Se descartó la hipótesis inicial de que el historial de sesiones (`sessionHistory`) estuviera creciendo el prompt — verificado por query directa: 0 de 10 sesiones en la cuenta de prueba tenían `completed_at`, por lo que ese bloque nunca se activó. La causa más probable es variabilidad natural del tiempo de respuesta de la API de DeepSeek combinada con un margen de por sí ajustado (10s) para un pipeline de RAG + LLM.
- **Solución**: Se habilitó Fluid Compute en la configuración del proyecto de Vercel (sube el límite de Hobby a hasta 300s) y se agregó `export const maxDuration = 60` explícito en `app/api/generate-session/route.ts` para no depender solo del default de la plataforma. El logging de diagnóstico agregado en el commit anterior se deja en el código (bajo costo, útil si vuelve a fallar por otra causa).
