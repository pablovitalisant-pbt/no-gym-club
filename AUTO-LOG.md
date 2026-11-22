# AUTO-LOG — No Gym Club

Registro de slices ejecutados en Modo PowerShell (Director → Programador). Una entrada por slice.

| Fecha | Slice | Programador | Resultado | Commit | Notas |
|-------|-------|-------------|-----------|--------|-------|
| 2026-11-21 | v2-01 catálogo solo calistenia + retiro GIFs | deep (USD 1.16, 40 turnos) | tsc 0, vitest 305/305, build 0; lint no ejecutable (sin config ESLint, preexistente). --apply por DT: 297 inactivos, 0 gifs (verificado SQL) | eaa9ce4 | Fase E UI diferida al barrido del slice v2-02 (entorno QA aún no existe) |
| 2026-11-21 | v2-03a assessment v2 datos (migracion 0010, validadores, deriveStartLevel) | deep (USD 1.42, 48 turnos) | tsc 0, lint 0 (agrega .eslintrc.json), vitest 332/332; migracion aplicada por DT via Supabase | (este commit) | ~550 lineas (excede 200, mayormente tests); sin UI, Fase E no aplica |
| 2026-11-21 | v2-03b assessment v2 UI (5 pasos: perfil+historial, equipo sin mancuernas, salud, cardio, PAR-Q) | deep (USD 2.12) | tsc 0, lint 0, vitest 344/344, build 0 | (este commit) | Fase E pendiente: entorno QA (v2-02) |
| 2026-11-21 | v2-04a corpus Overcoming Gravity (38 docs parafraseados + seed script) | deep (USD 2.29) | tests verdes; DT verificó parafraseo (4/38 docs con frases genéricas de 8 palabras, sin copia de párrafos) | (este commit) | --apply FALLÓ: modelo NVIDIA nv-embedqa-e5-v5 retirado (410 Gone) → Bug #9 |
