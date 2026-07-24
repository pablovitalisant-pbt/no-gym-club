export function normalizeExerciseName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // collapse multiple spaces
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
