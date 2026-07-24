/**
 * Backfill: genera embeddings para todas las filas del catálogo sin embedding.
 *
 * Para cada ejercicio sin embedding, arma un texto descriptivo y llama
 * a getEmbedding() de NVIDIA. Idempotente — solo procesa filas con
 * embedding IS NULL.
 *
 * Uso:
 *   npx tsx scripts/embed-exercises-catalog.ts          # dry-run (conteo)
 *   npx tsx scripts/embed-exercises-catalog.ts --write   # ejecuta
 *
 * NOTA: cada vez que se importen ejercicios nuevos hay que volver a
 * correr este script (los scripts de importación no generan embedding
 * automáticamente aún — pending future slice).
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

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']!;
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']!;
const NVIDIA_API_KEY = env['NVIDIA_API_KEY']!;

if (!SUPABASE_URL || !SERVICE_KEY || !NVIDIA_API_KEY) {
  console.error('Missing required env vars');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function main() {
  const writeMode = process.argv.includes('--write');

  // 1. Fetch exercises without embedding
  console.log('Fetching exercises without embedding...');
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exercises?select=id,slug,name_en,category,muscle_groups&embedding=is.null`,
    { headers: HEADERS },
  );
  if (!res.ok) {
    console.error(`Supabase error: ${res.status}`);
    process.exit(1);
  }
  const exercises = (await res.json()) as {
    id: string;
    slug: string;
    name_en: string;
    category: string;
    muscle_groups: string[];
  }[];
  console.log(`Exercises to embed: ${exercises.length}\n`);

  if (exercises.length === 0) {
    console.log('All exercises already have embeddings.');
    return;
  }

  if (!writeMode) {
    console.log('Dry-run — first 10:');
    exercises.slice(0, 10).forEach((ex) => console.log(`  ${ex.name_en} (${ex.category})`));
    if (exercises.length > 10) console.log(`  ... and ${exercises.length - 10} more`);
    console.log('\nRun with --write to embed.');
    return;
  }

  // 2. Embed each one
  let done = 0;
  let errors = 0;

  for (const ex of exercises) {
    const text = `${ex.name_en} — ${ex.category} — works ${(ex.muscle_groups || []).join(', ')}`;

    try {
      const embRes = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nv-embedqa-e5-v5',
          input: [`passage: ${text}`],
          input_type: 'passage',
        }),
      });

      if (!embRes.ok) {
        const err = (await embRes.text()).slice(0, 120);
        console.error(`  ✗ ${ex.name_en}: embedding API ${embRes.status} — ${err}`);
        errors++;
        continue;
      }

      const embData = (await embRes.json()) as { data: { embedding: number[] }[] };
      const vector = embData.data[0].embedding;

      // PATCH to Supabase
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${ex.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding: vector }),
      });

      if (!patchRes.ok) {
        const err = (await patchRes.text()).slice(0, 120);
        console.error(`  ✗ ${ex.name_en}: DB PATCH ${patchRes.status} — ${err}`);
        errors++;
        continue;
      }

      done++;
      if (done % 25 === 0) console.log(`  ${done}/${exercises.length}`);
    } catch (e: any) {
      console.error(`  ✗ ${ex.name_en}: ${e.message.slice(0, 120)}`);
      errors++;
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Embedded: ${done} | Errors: ${errors}`);
}

main().catch(console.error);
