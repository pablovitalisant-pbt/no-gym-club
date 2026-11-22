# Barrido total de la UI — No Gym Club

URL de pruebas: http://localhost:3123 (locale por defecto `es`; probar también `/en` en al menos una pantalla).
Cuentas: `qa.nuevo@nogym.test` (sin perfil: recorre el assessment), `qa.extremo@nogym.test` (50+, obesidad, nunca entrenó), `qa.intermedio@nogym.test` (activo, énfasis pecho+hombros).

## Barrido
- `/` (landing): manifiesto, CTA a registro, selector ES/EN.
- `/login`: acceso con email y contraseña, error claro con credenciales malas, enlace a registro.
- `/signup`: alta y validación de campos (no crear cuentas reales: solo validar errores de formulario).
- `/dashboard`: día actual del programa o acceso al assessment; navegación inferior; cerrar sesión.
- `/assessment`: 5 pasos (perfil + historial + meta particular, equipamiento sin mancuernas, salud, cardio, PAR-Q); validaciones; volver atrás conserva datos.
- `/assessment/test`: tests físicos con regresiones; guardado.
- `/exercises`: catálogo solo calistenia, placeholder visual en cada tarjeta, filtros, estado vacío.
- `/exercises/[slug]`: detalle, instrucciones, placeholder, volver.
- `/session/[id]`: temporizador, registro de reps por serie, finalización con RPE.
- `/progress`: historial y gráficos sin errores con 0 sesiones.
- `/weekly-report`: reporte sin errores con 0 sesiones.
