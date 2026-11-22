import type { PushupVariant, TrainingHistory } from './validate';

export type StartLevel =
  | 'untrained_extreme'
  | 'untrained'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export type DeclaredLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LevelProfile {
  training_history?: TrainingHistory | null;
  experience_level?: DeclaredLevel | null;
}

export interface LevelTest {
  pushup_variant?: PushupVariant | null;
  pushup_variant_reps?: number | null;
  max_pushups?: number | null;
  max_pullups?: number | null;
  dead_hang_seconds?: number | null;
  knee_plank_seconds?: number | null;
  plank_seconds?: number | null;
  sit_to_stand_30s?: number | null;
  walk_minutes?: number | null;
}

const LEVEL_ORDER: StartLevel[] = [
  'untrained_extreme',
  'untrained',
  'beginner',
  'intermediate',
  'advanced',
];

/**
 * Reglas (en orden, la primera que aplica gana):
 * 1. untrained_extreme: nunca entrenó Y (push-up wall/none O <8 sentadillas
 *    de silla en 30s O <10 min de caminata continua). Perfil de arranque
 *    mínima / riesgo alto.
 * 2. advanced: historial activo Y push-up de suelo >=20 Y dominadas >=10 Y
 *    plancha completa >=90 s.
 * 3. intermediate: historial activo o pasado Y >=2 indicadores intermedios:
 *    - empuje: push-up de suelo >=10 reps, o inclinado >=25 reps.
 *    - tracción: dominadas >=5, o colgarse >=60 s.
 *    - core: plancha completa >=60 s.
 *    - piernas/condición: sentadilla de silla >=15 Y caminata >=20 min.
 * 4. untrained: nunca entrenó (no extremo) O push-up wall/none O
 *    <8 sentadillas O <10 min caminata.
 * 5. beginner: el resto (con algo de capacidad o historial pasado).
 *
 * El nivel autodeclarado (experience_level) solo puede bajar el resultado:
 * nunca sube por encima de lo que muestran los tests y, si declaró
 * principiante, se aplica el criterio conservador.
 *
 * Historial ausente se trata como 'never' (conservador). Push-up ausente se
 * trata como 'none'.
 */
export function deriveStartLevel(
  profile: LevelProfile | null | undefined,
  test: LevelTest | null | undefined,
): StartLevel {
  const history = profile?.training_history ?? 'never';
  const variant = test?.pushup_variant ?? 'none';
  const reps = test?.pushup_variant_reps ?? test?.max_pushups ?? 0;
  const sit = test?.sit_to_stand_30s ?? null;
  const walk = test?.walk_minutes ?? null;

  const lowCapacity =
    variant === 'wall' ||
    variant === 'none' ||
    (sit !== null && sit < 8) ||
    (walk !== null && walk < 10);

  const indicators = [
    (variant === 'floor' && reps >= 10) || (variant === 'incline' && reps >= 25),
    (test?.max_pullups ?? 0) >= 5 || (test?.dead_hang_seconds ?? 0) >= 60,
    (test?.plank_seconds ?? 0) >= 60,
    (sit ?? 0) >= 15 && (walk ?? 0) >= 20,
  ].filter(Boolean).length;

  let level: StartLevel;
  if (history === 'never' && lowCapacity) {
    level = 'untrained_extreme';
  } else if (
    history === 'active' &&
    variant === 'floor' &&
    reps >= 20 &&
    (test?.max_pullups ?? 0) >= 10 &&
    (test?.plank_seconds ?? 0) >= 90
  ) {
    level = 'advanced';
  } else if ((history === 'active' || history === 'past') && indicators >= 2) {
    level = 'intermediate';
  } else if (history === 'never' || lowCapacity) {
    level = 'untrained';
  } else {
    level = 'beginner';
  }

  const declared = profile?.experience_level;
  if (declared && LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(declared)) {
    return declared;
  }
  return level;
}
