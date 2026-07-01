// Script de mantenimiento: poblar sport_science_corpus con embeddings NVIDIA NIM
// Ejecutar con: npx tsx scripts/seed-corpus.ts
// Requiere NVIDIA_API_KEY en .env.local

import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from '@/lib/nvidia/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// cargar .env.local sin dependencia dotenv
const envPath = resolve(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
for (const line of envRaw.split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CorpusDoc {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

function loadDocs(): CorpusDoc[] {
  // los documentos viven en el SQL de referencia
  const sqlPath = resolve(__dirname, '..', 'supabase', 'seed-corpus.sql');
  const raw = readFileSync(sqlPath, 'utf-8');

  const docs: CorpusDoc[] = [];
  const blocks = raw.split('INSERT INTO sport_science_corpus').filter((b) => b.includes('VALUES'));

  for (const block of blocks) {
    // extraer titulo
    const titleMatch = block.match(/'([^']+)'/);
    if (!titleMatch) continue;
    const title = titleMatch[1];

    // extraer content (segundo string, puede ser largo)
    const afterTitle = block.slice(block.indexOf(title) + title.length + 2);
    const contentStart = afterTitle.indexOf("'");
    const contentRest = afterTitle.slice(contentStart + 1);
    // encontrar el cierre de content (siguiente ' seguido de , o ))
    let contentEnd = -1;
    let depth = 1;
    for (let i = 0; i < contentRest.length - 1; i++) {
      if (contentRest[i] === "'" && contentRest[i + 1] === ',') { contentEnd = i; break; }
      if (contentRest[i] === "'" && contentRest[i + 1] === ')') { contentEnd = i; break; }
      if (contentRest[i] === "'" && contentRest[i + 1] === "'") { i++; continue; } // escaped quote
    }
    const content = contentRest.slice(0, contentEnd);

    // extraer category
    const catMatch = block.match(/'([a-z_]+)',\s*ARRAY/);
    const category = catMatch ? catMatch[1] : 'general';

    // extraer tags
    const tagsMatch = block.match(/ARRAY\[([\s\S]*?)\]/);
    const tags: string[] = [];
    if (tagsMatch) {
      const tagStr = tagsMatch[1];
      const tagMatches = tagStr.matchAll(/'([^']+)'/g);
      for (const m of tagMatches) tags.push(m[1]);
    }

    docs.push({ title, content, category, tags });
  }

  return docs;
}

async function main() {
  console.log('Cargando documentos...');
  const docs = loadDocs();
  console.log(`${docs.length} documentos encontrados.`);

  let inserted = 0;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    process.stdout.write(`[${i + 1}/${docs.length}] ${doc.title}... `);

    try {
      const embedding = await getEmbedding(doc.content);

      const { error } = await supabase.from('sport_science_corpus').insert({
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags,
        embedding: JSON.stringify(embedding),
      });

      if (error) {
        console.log(`ERROR: ${error.message}`);
      } else {
        console.log('OK');
        inserted++;
      }
    } catch (e: any) {
      console.log(`ERROR: ${e.message}`);
    }
  }

  console.log(`\n${inserted}/${docs.length} documentos insertados.`);
}

main();
