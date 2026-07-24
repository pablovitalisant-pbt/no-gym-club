/**
 * Descarga todos los GIFs del dataset y los sube a Supabase Storage.
 *
 * 1. Matchea cada ejercicio de la DB contra el dataset por name_en
 * 2. Descarga el GIF desde raw.githubusercontent.com
 * 3. Sube a Supabase Storage como {slug}.gif (público)
 * 4. Actualiza gif_url en la tabla exercises
 *
 * Uso:
 *   npx tsx scripts/upload-exercise-gifs.ts          # dry-run
 *   npx tsx scripts/upload-exercise-gifs.ts --write   # ejecuta
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const DATASET_URL =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
const BUCKET = 'exercise-gifs';

interface DatasetExercise {
  name: string;
  gif_url: string; // "videos/XXXX-XXXXX.gif"
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function download(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.arrayBuffer();
}

async function uploadToStorage(
  slug: string,
  data: ArrayBuffer,
): Promise<string> {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${slug}.gif`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...HEADERS, 'Content-Type': 'image/gif' },
    body: data,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Storage upload failed: ${r.status} — ${text.slice(0, 120)}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${slug}.gif`;
}

async function updateDbGifUrl(id: string, gifUrl: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ gif_url: gifUrl }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`DB update failed: ${r.status} — ${text.slice(0, 120)}`);
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const writeMode = process.argv.includes('--write');
  console.log(`Mode: ${writeMode ? 'WRITE' : 'DRY-RUN'}\n`);

  // 1. Fetch dataset
  console.log('Loading dataset...');
  const dsRes = await fetch(DATASET_URL);
  const allExercises = (await dsRes.json()) as DatasetExercise[];
  const byName = new Map<string, DatasetExercise>();
  for (const ex of allExercises) byName.set(ex.name.trim().toLowerCase(), ex);
  console.log(`Dataset: ${allExercises.length} exercises\n`);

  // 2. Fetch DB exercises
  console.log('Fetching exercises from DB...');
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/exercises?select=id,name_en,slug,gif_url`,
    { headers: HEADERS },
  );
  const dbExercises = (await dbRes.json()) as {
    id: string;
    name_en: string;
    slug: string;
    gif_url: string | null;
  }[];
  console.log(`DB: ${dbExercises.length} exercises\n`);

  // 3. Build worklist
  const worklist: {
    id: string;
    name_en: string;
    slug: string;
    datasetGifUrl: string;
    oldGifUrl: string | null;
  }[] = [];

  for (const ex of dbExercises) {
    const match = byName.get(ex.name_en.trim().toLowerCase());
    if (!match) {
      console.log(`  No dataset match for "${ex.name_en}" — skipping`);
      continue;
    }
    worklist.push({
      id: ex.id,
      name_en: ex.name_en,
      slug: ex.slug,
      datasetGifUrl: `${RAW_BASE}${match.gif_url}`,
      oldGifUrl: ex.gif_url,
    });
  }

  console.log(`To process: ${worklist.length} exercises\n`);

  if (worklist.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (!writeMode) {
    console.log('--- Dry-run summary ---');
    console.log(`  Would download and upload: ${worklist.length} GIFs`);
    console.log(`  Would update gif_url in DB for all`);
    console.log(`  Old GIFs in Storage will be overwritten (same slug)`);
    console.log('\nRun with --write to execute.');
    return;
  }

  // 4. Process with limited concurrency
  const CONCURRENCY = 5;
  let done = 0;
  let errors = 0;

  async function processOne(item: (typeof worklist)[0]) {
    try {
      const gifData = await download(item.datasetGifUrl);
      const publicUrl = await uploadToStorage(item.slug, gifData);
      await updateDbGifUrl(item.id, publicUrl);
      done++;
      if (done % 25 === 0 || done === worklist.length)
        console.log(`  ${done}/${worklist.length} — last: ${item.name_en}`);
    } catch (e: any) {
      errors++;
      console.error(`  ✗ ${item.name_en}: ${e.message.slice(0, 100)}`);
    }
  }

  console.log(`Processing ${worklist.length} GIFs (concurrency: ${CONCURRENCY})...\n`);

  // Run in batches
  for (let i = 0; i < worklist.length; i += CONCURRENCY) {
    const batch = worklist.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(processOne));
  }

  console.log(`\nDone. Updated: ${done} | Errors: ${errors}`);
}

main().catch(console.error);
