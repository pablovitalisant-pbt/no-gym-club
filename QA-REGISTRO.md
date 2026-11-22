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
- [ ] P-20261122-0006-1 (media) HALLAZGO: EXP-1 — Peso fuera de rango sin validación visible
- [ ] P-20261122-0006-2 (baja) HALLAZGO: EXP-2 — Texto largo en limitaciones
