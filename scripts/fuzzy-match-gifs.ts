/**
 * Fuzzy matching para los 14 ejercicios sin match exacto en el dataset.
 *
 * Busca el nombre más cercano por:
 * 1. Contención (un nombre contiene al otro)
 * 2. Solapamiento de palabras significativas
 * 3. Distancia de Levenshtein normalizada
 *
 * Uso:
 *   npx tsx scripts/fuzzy-match-gifs.ts          # dry-run
 *   npx tsx scripts/fuzzy-match-gifs.ts --write   # descarga + sube + actualiza
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
const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
const DATASET_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const BUCKET = 'exercise-gifs';

const HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(w => !['the', 'a', 'on', 'in', 'with'].includes(w)));
  const wordsB = new Set(b.split(/\s+/).filter(w => !['the', 'a', 'on', 'in', 'with'].includes(w)));
  let common = 0;
  for (const w of wordsA) if (wordsB.has(w)) common++;
  const total = new Set([...wordsA, ...wordsB]).size;
  return total === 0 ? 0 : common / total;
}

interface DatasetEx {
  name: string;
  gif_url: string;
}

function findBestMatch(
  searchName: string,
  dataset: DatasetEx[],
): { match: DatasetEx; score: number } | null {
  const norm = normalize(searchName);
  const candidates: { ex: DatasetEx; score: number }[] = [];

  for (const ex of dataset) {
    const exNorm = normalize(ex.name);
    if (exNorm === norm) return { match: ex, score: 1 };

    const overlap = wordOverlap(norm, exNorm);
    const levDist = levenshtein(norm, exNorm);
    const maxLen = Math.max(norm.length, exNorm.length);
    const levScore = maxLen === 0 ? 0 : 1 - levDist / maxLen;

    // Also check containment
    const contains = norm.includes(exNorm) || exNorm.includes(norm);
    const containBonus = contains ? 0.3 : 0;

    // Filter out clearly bad matches
    if (overlap === 0 && !contains) continue;

    const score = overlap * 0.5 + levScore * 0.3 + containBonus;
    candidates.push({ ex, score });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);

  // Only return if score is decent (>0.4)
  if (candidates[0].score < 0.4) return null;
  return { match: candidates[0].ex, score: candidates[0].score };
}

async function main() {
  const writeMode = process.argv.includes('--write');

  console.log('Loading dataset...');
  const dsRes = await fetch(DATASET_URL);
  const allExercises = (await dsRes.json()) as DatasetEx[];
  console.log(`Dataset: ${allExercises.length} exercises\n`);

  // The 14 unmatched exercises
  const unmatched = [
    'Incline Row', 'Dead Hang', 'Hanging Knee Raise', 'L-Sit on Bar',
    'Reverse Lunge', 'Step-Up', 'Bulgarian Split Squat', 'Pistol Squat',
    'Jumping Jacks', "Dumbbell Farmer's Walk", 'Cat-Cow Stretch',
    "World's Greatest Stretch", 'Shoulder Pass-Through', 'Crow Pose',
  ];

  const results: { name: string; match: string | null; score: number; gif: string | null }[] = [];

  for (const name of unmatched) {
    const best = findBestMatch(name, allExercises);
    if (best) {
      const gifUrl = best.match.gif_url ? RAW_BASE + best.match.gif_url : null;
      results.push({ name, match: best.match.name, score: best.score, gif: gifUrl });
      console.log(`${name}:`);
      console.log(`  → ${best.match.name} (score: ${best.score.toFixed(3)})`);
      console.log(`  ${gifUrl || '(no gif)'}`);
    } else {
      results.push({ name, match: null, score: 0, gif: null });
      console.log(`${name}: no match`);
    }
  }

  if (!writeMode) {
    console.log('\nDry-run complete. Run with --write to upload.');
    return;
  }

  // Fetch DB slugs
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/exercises?select=name_en,slug`,
    { headers: HEADERS },
  );
  const dbExercises = (await dbRes.json()) as { name_en: string; slug: string }[];
  const dbByName = new Map<string, string>();
  for (const ex of dbExercises) dbByName.set(normalize(ex.name_en), ex.slug);

  console.log('\nUploading...');
  let ok = 0, fail = 0;

  for (const r of results) {
    if (!r.gif) { console.log(`  ✗ ${r.name}: no GIF URL`); fail++; continue; }

    const slug = dbByName.get(normalize(r.name));
    if (!slug) { console.log(`  ✗ ${r.name}: no slug in DB`); fail++; continue; }

    // Download
    const gifRes = await fetch(r.gif);
    if (!gifRes.ok) { console.log(`  ✗ ${r.name}: download failed ${gifRes.status}`); fail++; continue; }
    const buf = await gifRes.arrayBuffer();

    // Upload with PUT (upsert)
    const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${slug}.gif`, {
      method: 'PUT',
      headers: { ...HEADERS, 'Content-Type': 'image/gif' },
      body: buf,
    });
    if (!upRes.ok) { const t = await upRes.text(); console.log(`  ✗ ${r.name}: upload ${upRes.status} ${t.slice(0,80)}`); fail++; continue; }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${slug}.gif`;

    // Update DB
    await fetch(`${SUPABASE_URL}/rest/v1/exercises?slug=eq.${slug}`, {
      method: 'PATCH',
      headers: { ...HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ gif_url: publicUrl }),
    });

    console.log(`  ✓ ${r.name} → ${r.match} (score: ${r.score.toFixed(3)})`);
    ok++;
  }

  console.log(`\nDone. OK: ${ok} | Fail: ${fail}`);
}

main().catch(console.error);
