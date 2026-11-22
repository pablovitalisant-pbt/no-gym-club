/** Quita las marcas de género del dataset ("(male)", "(female)") solo para mostrar. No traduce ni cambia claves de búsqueda. */
export function displayExerciseName(name: string): string {
  return name
    .replace(/\(\s*(?:male|female)\s*\)/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
