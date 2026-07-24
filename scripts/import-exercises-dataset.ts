/**
 * Script de importación de catálogo desde exercises-dataset (MIT).
 *
 * Fuente: https://github.com/hasaneyldrm/exercises-dataset
 * Reemplaza import-exercisedb-bodyweight.ts cuya paginación por cursor
 * estaba rota (Bug #7).
 *
 * Uso:
 *   npx tsx scripts/import-exercises-dataset.ts          # dry-run (default)
 *   npx tsx scripts/import-exercises-dataset.ts --write   # inserta a Supabase
 *
 * El dataset tiene 1,324 ejercicios. Se filtran solo los 325 bodyweight.
 * Sin imágenes/GIFs — las 43 filas existentes ya tienen gif_url, las
 * nuevas quedan con null (pendiente de sourcing futuro).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load .env.local ───
const envPath = resolve(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envRaw.split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const DATASET_URL =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';

const SUPABASE_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

// ─── Types ───
interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: Record<string, string>;
  instruction_steps: Record<string, string[]>;
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  image: string;
  gif_url: string;
  media_id: string;
  attribution: string;
}

const BODY_PART_MAP: Record<string, string> = {
  back: 'pull',
  cardio: 'cardio',
  chest: 'push',
  'lower arms': 'pull',
  'lower legs': 'legs',
  neck: 'mobility',
  shoulders: 'push',
  'upper arms': 'push',
  'upper legs': 'legs',
  waist: 'core',
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toCategory(bodyPart: string): string {
  return BODY_PART_MAP[bodyPart.toLowerCase()] ?? 'cardio';
}

// ─── Main ───
async function main() {
  const writeMode = process.argv.includes('--write');
  console.log(`Mode: ${writeMode ? 'WRITE to Supabase' : 'DRY-RUN (add --write to insert)'}`);
  console.log(`Source: ${DATASET_URL}\n`);

  // 1. Fetch dataset
  console.log('Fetching exercises dataset...');
  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    console.error(`Dataset fetch error: ${res.status}`);
    process.exit(1);
  }
  const allExercises = (await res.json()) as DatasetExercise[];
  console.log(`Total in dataset: ${allExercises.length}`);

  // 2. Filter to bodyweight only
  const bodyweight = allExercises.filter((ex) => ex.equipment === 'body weight');
  console.log(`Bodyweight exercises: ${bodyweight.length} / ${allExercises.length}\n`);

  // 3. Fetch existing exercises from Supabase
  console.log('Fetching existing exercises from Supabase...');
  const existRes = await fetch(`${SUPABASE_URL}/rest/v1/exercises?select=name_en`, {
    headers: SUPABASE_HEADERS,
  });
  if (!existRes.ok) {
    console.error(`Supabase error: ${existRes.status} — ${(await existRes.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const existing = (await existRes.json()) as { name_en: string }[];
  const seen = new Set(existing.map((e) => e.name_en.toLowerCase().trim()));
  console.log(`Existing in DB: ${existing.length}\n`);

  // 4. Determine what would be inserted
  const toInsert: DatasetExercise[] = [];
  for (const ex of bodyweight) {
    const key = ex.name.trim().toLowerCase();
    if (!seen.has(key)) {
      toInsert.push(ex);
    }
  }

  console.log(`New exercises to insert: ${toInsert.length}`);
  console.log(`Skipped (already exist): ${bodyweight.length - toInsert.length}\n`);

  if (toInsert.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  if (!writeMode) {
    console.log('--- Dry-run: first 10 to insert ---');
    toInsert.slice(0, 10).forEach((ex) => {
      console.log(`  ${ex.name} (${ex.body_part})`);
    });
    if (toInsert.length > 10) {
      console.log(`  ... and ${toInsert.length - 10} more`);
    }
    console.log('\nRun with --write to insert.');
    return;
  }

  // 5. Write mode
  let inserted = 0;
  let errors = 0;

  for (const ex of toInsert) {
    const name = ex.name.trim();

    const body = {
      slug: toSlug(name),
      name_es: name, // dataset no tiene name_es
      name_en: name,
      instructions_es: ex.instruction_steps?.es ?? [],
      instructions_en: ex.instruction_steps?.en ?? [],
      muscle_groups: [ex.muscle_group],
      secondary_muscles: ex.secondary_muscles ?? [],
      equipment_required: ['bodyweight'],
      difficulty: 'beginner',
      category: toCategory(ex.body_part),
      is_active: true,
    };

    const ins = await fetch(`${SUPABASE_URL}/rest/v1/exercises`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify(body),
    });

    if (!ins.ok) {
      const err = (await ins.text()).slice(0, 150);
      console.error(`  ✗ "${name}": ${ins.status} — ${err}`);
      errors++;
      continue;
    }

    inserted++;
    if (inserted % 25 === 0) {
      console.log(`  ... ${inserted}/${toInsert.length} inserted`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted} | Errors: ${errors}`);
}

main().catch(console.error);
