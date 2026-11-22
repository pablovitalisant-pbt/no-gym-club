/**
 * Seed: corpus de principios de Overcoming Gravity (parafraseado).
 *
 * Lee supabase/corpus-og.json, genera embeddings con NVIDIA NIM
 * (input_type=passage) e inserta en sport_science_corpus con service role.
 *
 * Uso:
 *   npx tsx scripts/seed-corpus-og.ts          # dry-run: conteo por categoria
 *   npx tsx scripts/seed-corpus-og.ts --apply  # inserta (idempotente por title)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getEmbedding } from '@/lib/nvidia/client';

type Doc = {
  title: string;
  content: string;
  category: string;
  tags: string[];
};

const docsPath = resolve(__dirname, '..', 'supabase', 'corpus-og.json');
const docs: Doc[] = JSON.parse(readFileSync(docsPath, 'utf-8'));

function countByCategory(): Record<string, number> {
  return docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});
}

async function apply() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envRaw = readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  envRaw.split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim();
  });

  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!supabaseUrl || !serviceKey || !env['NVIDIA_API_KEY']) {
    console.error('Missing required env vars (Supabase URL, service role, NVIDIA key)');
    process.exit(1);
  }
  process.env.NVIDIA_API_KEY = env['NVIDIA_API_KEY'];

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/sport_science_corpus?select=title`,
    { headers },
  );
  if (!existingRes.ok) {
    console.error(`DB read ${existingRes.status} — ${(await existingRes.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const existing = new Set(
    ((await existingRes.json()) as { title: string }[]).map((r) => r.title),
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of docs) {
    if (existing.has(doc.title)) {
      skipped++;
      continue;
    }
    try {
      const embedding = await getEmbedding(doc.content, 'passage');
      const res = await fetch(`${supabaseUrl}/rest/v1/sport_science_corpus`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: doc.title,
          content: doc.content,
          category: doc.category,
          tags: doc.tags,
          embedding,
        }),
      });
      if (!res.ok) {
        console.error(`  x ${doc.title}: DB ${res.status} — ${(await res.text()).slice(0, 120)}`);
        errors++;
        continue;
      }
      inserted++;
      console.log(`  + ${doc.title}`);
    } catch (e: any) {
      console.error(`  x ${doc.title}: ${e.message.slice(0, 120)}`);
      errors++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nInserted: ${inserted} | Skipped: ${skipped} | Errors: ${errors}`);
}

async function main() {
  if (!process.argv.includes('--apply')) {
    console.log(`corpus-og: ${docs.length} documentos (dry-run, usar --apply para insertar)`);
    for (const [category, count] of Object.entries(countByCategory())) {
      console.log(`  ${category}: ${count}`);
    }
    return;
  }
  await apply();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
