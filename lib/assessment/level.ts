import type { PushupVariant, TrainingHistory } from './validate';

export type StartLevel =
  | 'untrained_extreme'
  | 'untrained'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export interface LevelProfile {
  training_history?: TrainingHistory | null;
}

export interface LevelTest {
  pushup_variant?: PushupVariant | null;
  pushup_variant_reps?: number | null;
  max_pushups?: number | null;
  sit_to_stand_30s?: number | null;
  walk_minutes?: number | null;
}

/**
 * Reglas (en orden, la primera que aplica gana):
 * 1. untrained_extreme: nunca entrenó Y (push-up wall/none O <8 sentadillas
 *    de silla en 30s O <10 min de caminata continua). Perfil de arranque
 *    mínima / riesgo alto.
 * 2. advanced: historial activo Y push-up de suelo Y >=20 reps.
 * 3. intermediate: (activo o pasado) Y push-up de suelo Y >=10 reps.
 * 4. untrained: nunca entrenó (no extremo) O push-up wall/none O
 *    <8 sentadillas O <10 min caminata.
 * 5. beginner: el resto (con algo de capacidad o historial pasado).
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

  if (history === 'never' && lowCapacity) return 'untrained_extreme';
  if (history === 'active' && variant === 'floor' && reps >= 20) return 'advanced';
  if ((history === 'active' || history === 'past') && variant === 'floor' && reps >= 10) {
    return 'intermediate';
  }
  if (history === 'never' || lowCapacity) return 'untrained';
  return 'beginner';
}
