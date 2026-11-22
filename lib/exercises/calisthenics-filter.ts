const NON_CALISTHENICS_NAME_PATTERNS = [
  'dumbbell',
  'exercise ball',
  'stability ball',
  'bosu',
  'cable',
  'machine',
  'barbell',
  'balance board',
  'arm blaster',
  'stepbox',
  'wheel run',
  'captains chair',
  '(equipment)',
];

/**
 * Un ejercicio es calistenia si no requiere material de gimnasio.
 * bench/barra/pared/suelo/peso corporal cuentan como calistenia.
 */
export function isCalisthenics(ex: {
  name_en: string;
  equipment_required: string[];
}): boolean {
  const equipment = (ex.equipment_required || []).map((e) => e.toLowerCase());
  if (equipment.some((e) => e.includes('dumbbell'))) return false;

  const name = (ex.name_en || '').toLowerCase();
  return !NON_CALISTHENICS_NAME_PATTERNS.some((pattern) => name.includes(pattern));
}
