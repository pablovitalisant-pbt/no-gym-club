/**
 * Importa ejercicios bodyweight + dumbbell desde exercises-dataset (MIT).
 *
 * Fuente: https://github.com/hasaneyldrm/exercises-dataset
 * Solo asigna datos planos: nombre, instrucciones, músculos.
 * NO asigna equipment_required para bodyweight (lo completa classify).
 * NO asigna category nunca (lo completa classify).
 *
 * Uso:
 *   npx tsx scripts/import-exercises-dataset.ts          # dry-run
 *   npx tsx scripts/import-exercises-dataset.ts --write   # inserta
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envRaw.split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const DATASET_URL =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';

const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

interface DatasetExercise {
  id: string;
  name: string;
  equipment: string;
  instruction_steps: Record<string, string[]>;
  muscle_group: string;
  secondary_muscles: string[];
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const writeMode = process.argv.includes('--write');
  console.log(`Mode: ${writeMode ? 'WRITE' : 'DRY-RUN'}\n`);

  // 1. Fetch dataset
  console.log('Fetching dataset...');
  const res = await fetch(DATASET_URL);
  const all = (await res.json()) as DatasetExercise[];
  console.log(`Total: ${all.length}`);

  // 2. Filter body weight OR dumbbell
  const filtered = all.filter((ex) => ex.equipment === 'body weight' || ex.equipment === 'dumbbell');
  const bodyweight = filtered.filter((e) => e.equipment === 'body weight');
  const dumbbell = filtered.filter((e) => e.equipment === 'dumbbell');
  console.log(`Bodyweight: ${bodyweight.length} | Dumbbell: ${dumbbell.length} | Total: ${filtered.length}\n`);

  // 3. Fetch existing
  console.log('Fetching existing...');
  const existRes = await fetch(`${SUPABASE_URL}/rest/v1/exercises?select=name_en`, { headers: HEADERS });
  const existing = (await existRes.json()) as { name_en: string }[];
  const seen = new Set(existing.map((e) => e.name_en.toLowerCase().trim()));
  console.log(`Existing in DB: ${existing.length}\n`);

  // 4. Find new
  const toInsert: DatasetExercise[] = [];
  for (const ex of filtered) {
    if (!seen.has(ex.name.trim().toLowerCase())) toInsert.push(ex);
  }
  console.log(`To insert: ${toInsert.length} (${filtered.length - toInsert.length} exist)\n`);

  if (toInsert.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  if (!writeMode) {
    console.log('--- Dry-run (first 15) ---');
    toInsert.slice(0, 15).forEach((ex) => console.log(`  ${ex.name} [${ex.equipment}]`));
    if (toInsert.length > 15) console.log(`  ... and ${toInsert.length - 15} more`);
    console.log('\nRun with --write to insert.');
    return;
  }

  // 5. Write
  let inserted = 0;
  let errors = 0;

  for (const ex of toInsert) {
    const isDumbbell = ex.equipment === 'dumbbell';
    const body: Record<string, any> = {
      slug: toSlug(ex.name.trim()),
      name_es: ex.name.trim(),
      name_en: ex.name.trim(),
      instructions_es: ex.instruction_steps?.es ?? [],
      instructions_en: ex.instruction_steps?.en ?? [],
      muscle_groups: [ex.muscle_group],
      secondary_muscles: ex.secondary_muscles ?? [],
      difficulty: 'beginner',
      is_active: true,
    };
    if (isDumbbell) body.equipment_required = ['dumbbell'];
    if (!isDumbbell) body.equipment_required = null;
    body.category = null; // null explícito — columna NOT NULL sin default, classify lo completa

    const ins = await fetch(`${SUPABASE_URL}/rest/v1/exercises`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
    });

    if (!ins.ok) {
      console.error(`  ✗ "${ex.name}": ${ins.status} — ${(await ins.text()).slice(0, 120)}`);
      errors++;
      continue;
    }
    inserted++;
    if (inserted % 25 === 0) console.log(`  ${inserted}/${toInsert.length}`);
  }

  console.log(`\nDone. Inserted: ${inserted} | Errors: ${errors}`);
}

main().catch(console.error);
