// Genera SQL con embeddings para seed-corpus
// Uso: npx tsx scripts/seed-corpus.ts > supabase/seed-corpus-embeddings.sql
// Luego aplicar el SQL generado via MCP

import { getEmbedding } from '@/lib/nvidia/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// cargar .env.local
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

interface Doc {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

function loadDocs(): Doc[] {
  const sqlPath = resolve(__dirname, '..', 'supabase', 'seed-corpus.sql');
  const raw = readFileSync(sqlPath, 'utf-8');
  const docs: Doc[] = [];
  const blocks = raw
    .split('INSERT INTO sport_science_corpus')
    .filter((b) => b.includes('VALUES'));

  for (const block of blocks) {
    const titleMatch = block.match(/'([^']+)'/);
    if (!titleMatch) continue;
    const title = titleMatch[1];

    // content (segundo string)
    const afterTitle = block.slice(
      block.indexOf(title) + title.length + 2,
    );
    const contentStart = afterTitle.indexOf("'");
    const contentRest = afterTitle.slice(contentStart + 1);
    let contentEnd = -1;
    for (let i = 0; i < contentRest.length - 1; i++) {
      if (contentRest[i] === "'" && contentRest[i + 1] === ',') {
        contentEnd = i;
        break;
      }
      if (contentRest[i] === "'" && contentRest[i + 1] === ')') {
        contentEnd = i;
        break;
      }
      if (contentRest[i] === "'" && contentRest[i + 1] === "'") {
        i++;
        continue;
      }
    }
    const content = contentRest.slice(0, contentEnd);

    const catMatch = block.match(/'([a-z_]+)',\s*ARRAY/);
    const category = catMatch ? catMatch[1] : 'general';

    const tagsMatch = block.match(/ARRAY\[([\s\S]*?)\]/);
    const tags: string[] = [];
    if (tagsMatch) {
      const tagMatches = tagsMatch[1].matchAll(/'([^']+)'/g);
      for (const m of tagMatches) tags.push(m[1]);
    }

    docs.push({ title, content, category, tags });
  }

  return docs;
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

async function main() {
  const docs = loadDocs();
  console.log(`-- Seed corpus embeddings — ${docs.length} documentos`);
  console.log(`-- Generado: ${new Date().toISOString()}`);
  console.log('');

  let count = 0;
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    process.stderr.write(`[${i + 1}/${docs.length}] ${doc.title}... `);

    try {
      const embedding = await getEmbedding(doc.content);

      const tagStr = doc.tags.map((t) => `'${escapeSql(t)}'`).join(', ');
      const embStr = `[${embedding.join(',')}]`;

      console.log(
        `INSERT INTO sport_science_corpus (title, content, category, tags, embedding) VALUES (`,
      );
      console.log(`  '${escapeSql(doc.title)}',`);
      console.log(`  '${escapeSql(doc.content)}',`);
      console.log(`  '${escapeSql(doc.category)}',`);
      console.log(`  ARRAY[${tagStr}],`);
      console.log(`  '${embStr}'`);
      console.log(`);`);
      console.log('');

      count++;
      process.stderr.write('OK\n');
    } catch (e: any) {
      process.stderr.write(`ERROR: ${e.message}\n`);
    }
  }

  process.stderr.write(`\n${count}/${docs.length} documentos procesados.\n`);
}

main();
