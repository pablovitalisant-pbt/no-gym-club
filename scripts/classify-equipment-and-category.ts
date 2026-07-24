/**
 * Clasifica equipamiento + categoría de ejercicios por lotes vía LLM.
 *
 * Agrupa ejercicios sin clasificar en lotes de 25, un solo prompt por lote
 * pidiendo un array JSON. Usa generateChatCompletion de lib/deepseek/client.ts
 * (jsonMode: true) para evitar el problema de modo thinking (Bug #4).
 *
 * Uso:
 *   npx tsx scripts/classify-equipment-and-category.ts          # dry-run
 *   npx tsx scripts/classify-equipment-and-category.ts --write   # clasifica
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

// Set env for deepseek client before importing
process.env.DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
process.env.DEEPSEEK_BASE_URL = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

import { generateChatCompletion } from '@/lib/deepseek/client';

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const VALID_EQUIPMENT = ['bodyweight', 'bar', 'wall', 'ground'] as const;
const VALID_CATEGORIES = ['push', 'pull', 'core', 'legs', 'cardio', 'mobility', 'skill'] as const;

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/** Build the batch prompt for N exercises */
function buildBatchPrompt(
  batch: { name_en: string; muscle_groups: string[]; instructions_en: string[] }[],
): string {
  const items = batch
    .map(
      (ex, i) =>
        `${i + 1}. "${ex.name_en}" — muscles: ${(ex.muscle_groups || []).join(', ')} — instructions: ${(ex.instructions_en || []).slice(0, 2).join(' ')}`,
    )
    .join('\n');

  return `Classify each exercise for a calisthenics app. Respond with a JSON array only, no other text.

Rules:
- "equipment" — what surface/structure does this exercise NEED? One of: ${VALID_EQUIPMENT.join(', ')}. bodyweight = floor/no equipment needed; bar = needs a pull-up bar; wall = needs a wall; ground = ground contact (lying/sitting on floor, e.g. crunches, glute bridges).
- "category" — movement pattern: ${VALID_CATEGORIES.join(', ')}.

Exercises to classify:
${items}

Respond with JSON array: [{ "name": "...", "equipment": "...", "category": "..." }, ...]`;
}

async function main() {
  const writeMode = process.argv.includes('--write');
  console.log(`Mode: ${writeMode ? 'WRITE' : 'DRY-RUN'}\n`);

  // Fetch unclassified exercises
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exercises?select=id,name_en,muscle_groups,instructions_en,category,equipment_required&category=is.null&order=created_at.asc`,
    { headers: HEADERS },
  );
  const exercises = (await res.json()) as {
    id: string; name_en: string;
    muscle_groups: string[]; instructions_en: string[];
    category: string | null; equipment_required: string[] | null;
  }[];

  console.log(`Unclassified: ${exercises.length}\n`);

  if (exercises.length === 0) { console.log('Nothing to classify.'); return; }

  if (!writeMode) {
    console.log('--- Dry-run ---');
    console.log(`Would classify ${exercises.length} exercises in ~${Math.ceil(exercises.length / 25)} batches of 25.`);
    console.log('First 10:');
    exercises.slice(0, 10).forEach((ex) => {
      const equip = ex.equipment_required ? ex.equipment_required.join(',') : '(null)';
      console.log(`  ${ex.name_en} [equip: ${equip}]`);
    });
    if (exercises.length > 10) console.log(`  ... and ${exercises.length - 10} more`);
    console.log('\nRun with --write to classify.');
    return;
  }

  // Process in batches
  const BATCH_SIZE = 25;
  let classified = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(exercises.length / BATCH_SIZE);
    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} exercises)...`);

    const prompt = buildBatchPrompt(batch);

    let resultText: string;
    try {
      resultText = await generateChatCompletion(
        [{ role: 'user', content: prompt }],
        { jsonMode: true, maxTokens: 4096 },
      );
    } catch (e: any) {
      console.error(`  ✗ Batch ${batchNum} failed: ${e.message.slice(0, 120)}`);
      errors += batch.length;
      continue;
    }

    let parsed: { name: string; equipment: string; category: string }[];
    try {
      parsed = JSON.parse(resultText);
      if (!Array.isArray(parsed)) throw new Error('not an array');
    } catch {
      console.error(`  ✗ Batch ${batchNum}: LLM returned invalid JSON, skipping batch`);
      errors += batch.length;
      continue;
    }

    // Match results back to DB exercises by name
    for (const item of parsed) {
      const dbEx = batch.find(
        (ex) => ex.name_en.toLowerCase().trim() === (item.name || '').toLowerCase().trim(),
      );
      if (!dbEx) {
        console.log(`  ? "${item.name}": no match in batch, skipping`);
        skipped++;
        continue;
      }

      if (
        !VALID_EQUIPMENT.includes(item.equipment as any) ||
        !VALID_CATEGORIES.includes(item.category as any)
      ) {
        console.log(`  ? ${dbEx.name_en}: invalid classification (equip=${item.equipment}, cat=${item.category}), skipping`);
        skipped++;
        continue;
      }

      const update: Record<string, any> = { category: item.category };
      if (!dbEx.equipment_required || dbEx.equipment_required.length === 0) {
        update.equipment_required = [item.equipment];
      }

      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${dbEx.id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify(update),
      });

      if (!patchRes.ok) {
        console.error(`  ✗ ${dbEx.name_en}: PATCH ${patchRes.status}`);
        errors++;
        continue;
      }
      classified++;
    }

    console.log(`  → ${classified} classified so far`);
  }

  console.log(`\nDone. Classified: ${classified} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log('Re-run for future imports (idempotent — only processes category IS NULL).');
}

main().catch(console.error);
