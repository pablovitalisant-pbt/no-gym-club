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
