# PRD — Corrección de flujo del Session Runner

> Complementa el PRD.md raíz. No lo reemplaza. Cubre exclusivamente los 4 sub-slices aprobados el 2026-07-07 para corregir el motor de sesión (`session-runner.tsx`).
>
> **Estado: ✅ Completo.** Los 4 sub-slices fueron implementados, revisados y comiteados.

---

## 1. Qué es este cambio

El motor de sesión (Session Runner) ejecuta la sesión diaria: calentamiento → sets → estiramiento. Tenía tres fallas de flujo detectadas en uso real:

1. Los ejercicios por tiempo (ej. trotar 120s) no tenían cronómetro — el usuario debía controlar el tiempo por su cuenta y avanzar manualmente.
2. El registro de reps reales por ejercicio no ocurría en el momento (durante la sesión), sino después, junto al RPE, en el dashboard — con alto riesgo de que el usuario olvide cuántas reps hizo.
3. No había descanso entre el calentamiento y el primer set porque la IA nunca generaba ese dato para los ejercicios de calentamiento.

Este PRD corrigió las tres, más agregó control de audio.

---

## 2. Usuarios

Mismo usuario que el PRD raíz: el atleta que ejecuta su sesión diaria en tiempo real, típicamente con el teléfono en la mano o apoyado durante el entrenamiento.

---

## 3. Alcance — Lo mínimo que debía funcionar

1. **Cronómetro para ejercicios por tiempo** — cualquier ejercicio con `duration_seconds` (warmup, main o cooldown) muestra un botón "Vamos!" que arranca una cuenta regresiva visible. Al llegar a 0, suena una alarma y la app avanza sola al siguiente paso (descanso si corresponde, si no el siguiente ejercicio). ✅
2. **Descanso calentamiento → primer set generado por la IA** — el prompt de generación de sesión le pide a la IA asignar `rest_seconds` también a los ejercicios de calentamiento, calibrado según la condición física del atleta (edad, nivel de experiencia). El session runner ya dispara descanso automáticamente ante cualquier `rest_seconds` presente, sin importar la sección. ✅
3. **Registro inmediato de reps reales** — en cada ejercicio de sets/reps, al presionar "Listo" el usuario ingresa la cantidad real de reps hechas *antes* de avanzar, y se guarda en la base de datos en ese instante (no se espera al cierre de la sesión). El formulario post-sesión del dashboard dejó de pedir este dato — solo pide RPE y notas. ✅
4. **Toggle de audio on/off** — un switch visible durante toda la sesión permite activar/desactivar la alarma sonora de todos los cronómetros (descanso y ejercicios por tiempo). Persistencia en `localStorage`. ✅

---

## 4. Qué NO es parte de este alcance

- Registro de resultado (reps, tiempo real sostenido) para ejercicios de calentamiento o estiramiento.
- Volumen configurable de la alarma — solo on/off.
- Vibración en mobile.
- Sonido personalizable o música de fondo.
- Persistencia del toggle de audio entre dispositivos (queda en `localStorage`, no en el perfil del usuario).
- Cambios al cuestionario de RPE de cierre de sesión.

---

## 5. Integraciones externas conocidas

Ninguna nueva. Se apoyó en las ya existentes: DeepSeek (prompt de generación de sesión) y Supabase (persistencia de `log_data` en `workout_sessions`).

---

## 6. Restricciones técnicas

- Sin dependencias nuevas. La alarma sonora sigue siendo sintetizada vía Web Audio API (`lib/audio.ts`).
- Cada sub-slice se mantuvo bajo 200 líneas por archivo modificado.

---

## 7. Escala esperada

Sin cambio respecto al PRD raíz.

---

## 8. Sub-slices — estado final

| # | Nombre | Commit | Archivos principales | Tests agregados |
|---|--------|--------|----------------------|------------------|
| 1 | Cronómetro + alarma para ejercicios por tiempo | `4cd1f78` | `session-runner.tsx` | +8 |
| 2 | Descanso calentamiento→primer set generado por IA | `7bf1195` | `lib/prompts/build-session-prompt.ts` | +3 |
| 3 | Registro inmediato de reps reales | `f22dbf9` | `session-runner.tsx`, `session/[id]/actions.ts`, `dashboard/log-form.tsx`, `dashboard/actions.ts` | +6 |
| 4 | Toggle de audio on/off (localStorage) | (pendiente de hash — commit en curso) | `lib/useAudioPreference.ts` (nuevo), `session-runner.tsx` | +6 |

Test suite final: 182 tests, 28 archivos, 0 regresiones. `tsc --noEmit` limpio. `next build` limpio en cada sub-slice.

---

## 9. Bugs reales encontrados y corregidos durante el desarrollo

Ninguno de estos estaba en el contrato original de Fase A — se detectaron en revisión antes de cada commit:

1. **`saveSessionTimes()` sobreescribía `log_data` sin merge** (pre-existente, expuesto por el Sub-slice 3). Fix: helper `mergeLogData()` compartido (SELECT + spread + UPDATE).
2. **`saveExerciseReps()` optimista mandaba solo la entrada nueva (`[entry]`) en vez del ref acumulado completo.** Causaba pérdida silenciosa de entradas previas en DB si la sesión no llegaba a `state === 'done'` (ej. usuario cierra la app a mitad de entrenamiento). Fix: mandar `exerciseLogRef.current` completo en cada escritura, no un delta.

Ambos quedaron documentados en la sección "Zonas de riesgo conocidas" del `PRD.md` raíz, en `session/[id]/actions.ts`, como zona sensible para cualquier slice futuro que toque `log_data`.

---

## 10. Zonas de riesgo conocidas (específicas de este feature)

| Archivo / módulo | Riesgo | Qué no tocar sin revisar |
|-----------------|--------|--------------------------|
| `session-runner.tsx` | Archivo tocado por los 4 sub-slices. El state machine acumuló estados: `idle → active → timing/reps → rest → done`. Cualquier cambio futuro debe revisar los 4 contratos en conjunto antes de modificar `RunnerState` o el flujo de `handleDone`. | No modificar el state machine sin revisar el historial completo de los 4 sub-slices. |
| `lib/prompts/build-session-prompt.ts` | El prompt le pide a la IA asignar `rest_seconds` a warmup calibrado por edad/experiencia. Si la IA no respeta el formato, el mecanismo de descanso (genérico, section-agnóstico) simplemente no se dispara para esa sesión — falla silenciosa, no error visible. | Validar con generaciones reales periódicamente que `warmup[].rest_seconds` sigue llegando bien formado. |
| `session/[id]/actions.ts` | Ver entrada correspondiente en `PRD.md` raíz — patrón `mergeLogData()` obligatorio para cualquier escritura a `log_data`. | Ver PRD.md raíz, sección 9. |
