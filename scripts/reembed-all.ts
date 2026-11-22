/**
 * Bug #9: re-embebe TODO el corpus y el catálogo con el modelo nuevo.
 * Los vectores de modelos distintos no son comparables; hay que re-generarlos.
 *
 * Uso:
 *   npx tsx scripts/reembed-all.ts           # dry-run: conteos
 *   npx tsx scripts/reembed-all.ts --apply   # UPDATE de embedding por lotes de 50
 *   npx tsx scripts/reembed-all.ts --apply --from-exercises 250  # retoma desde la fila 250
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getEmbedding, buildExerciseEmbeddingText } from '@/lib/nvidia/client';

type CorpusRow = { id: string; content: string };
type ExerciseRow = {
  id: string;
  name_en: string;
  category: string;
  muscle_groups: string[] | null;
};

const envPath = resolve(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envRaw.split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
if (!SUPABASE_URL || !SERVICE_KEY || !env['NVIDIA_API_KEY']) {
  console.error('Missing required env vars (Supabase URL, service role, NVIDIA key)');
  process.exit(1);
}
process.env.NVIDIA_API_KEY = env['NVIDIA_API_KEY'];

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};
const BATCH_SIZE = 50;
const PAGE_SIZE = 1000;

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${select}&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`,
      { headers: HEADERS },
    );
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function patchEmbedding(table: string, id: string, vector: number[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ embedding: vector }),
  });
  if (!res.ok) throw new Error(`${table}/${id}: ${res.status} ${await res.text()}`);
}

async function reembed(
  table: string,
  items: { id: string; text: string }[],
): Promise<number> {
  let done = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    for (const item of batch) {
      const vector = await getEmbedding(item.text, 'passage');
      await patchEmbedding(table, item.id, vector);
      await new Promise((r) => setTimeout(r, 200)); // rate limit
    }
    done += batch.length;
    console.log(`  ${table}: ${done}/${items.length}`);
  }
  return done;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const fromArg = process.argv.indexOf('--from-exercises');
  const fromExercises = fromArg !== -1 ? Number(process.argv[fromArg + 1]) : 1;
  if (!Number.isInteger(fromExercises) || fromExercises < 1) {
    console.error('--from-exercises requiere un entero >= 1');
    process.exit(1);
  }

  const [corpus, exercises] = await Promise.all([
    fetchAll<CorpusRow>('sport_science_corpus', 'id,content'),
    fetchAll<ExerciseRow>('exercises', 'id,name_en,category,muscle_groups'),
  ]);

  console.log(`sport_science_corpus: ${corpus.length} filas`);
  console.log(`exercises: ${exercises.length} filas`);

  if (!apply) {
    console.log('\nDry-run — no se escribió nada. Usar --apply para re-embeber.');
    return;
  }

  await reembed(
    'sport_science_corpus',
    corpus.map((r) => ({ id: r.id, text: r.content })),
  );
  await reembed(
    'exercises',
    exercises
      .slice(fromExercises - 1)
      .map((r) => ({ id: r.id, text: buildExerciseEmbeddingText(r) })),
  );
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
