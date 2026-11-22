export function normalizeExerciseName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // collapse multiple spaces
}

/**
 * Resuelve la media de un ejercicio del catálogo.
 * Sin gif ni imagen → placeholder (la UI dibuja su propio fallback).
 */
export function resolveExerciseMedia(ex: {
  gif_url: string | null;
  image_url?: string | null;
}): { src: string | null; placeholder: boolean } {
  const src = ex.gif_url || ex.image_url || null;
  return { src, placeholder: src === null };
}

export function resolveExerciseGif(
  exerciseName: string,
  catalog: { name_en: string; gif_url: string | null }[],
): string | null {
  const key = normalizeExerciseName(exerciseName);
  for (const entry of catalog) {
    if (entry.gif_url && normalizeExerciseName(entry.name_en) === key) {
      return entry.gif_url;
    }
  }
  return null;
}
