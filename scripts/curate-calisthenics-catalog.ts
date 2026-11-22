/**
 * Cura el catálogo a solo calistenia y retira los GIFs.
 *
 * Uso:
 *   npx tsx scripts/curate-calisthenics-catalog.ts          # dry-run
 *   npx tsx scripts/curate-calisthenics-catalog.ts --apply  # escribe
 *
 * --apply primero respalda TODAS las filas en ../_dt/backups/, luego
 * is_active=false en las no-calistenia y gif_url=null en todas. Nunca borra.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { isCalisthenics } from '@/lib/exercises/calisthenics-filter';

const root = resolve(__dirname, '..');
const envRaw = readFileSync(resolve(root, '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envRaw.split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

type Row = {
  id: string;
  name_en: string;
  equipment_required: string[];
  is_active: boolean;
  gif_url: string | null;
  image_url: string | null;
};

const PAGE = 1000;

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/exercises?select=id,name_en,equipment_required,is_active,gif_url,image_url&order=id.asc`,
      { headers: { ...HEADERS, 'Range-Unit': 'items', Range: `${from}-${from + PAGE - 1}` } },
    );
    if (!res.ok) throw new Error(`GET exercises: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as Row[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

async function patch(filter: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/exercises?${filter}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${filter}: ${res.status} ${await res.text()}`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

  const rows = await fetchAll();
  const excluded = rows.filter((r) => !isCalisthenics(r));
  const kept = rows.length - excluded.length;

  console.log(`Total: ${rows.length}`);
  console.log(`Quedarían activos: ${kept}`);
  console.log(`Quedarían inactivos: ${excluded.length}`);
  console.log('\nA desactivar:');
  excluded.forEach((r) => console.log(`  - ${r.name_en} [${(r.equipment_required || []).join(',') || '—'}]`));

  if (!apply) {
    console.log('\nDry-run: no se escribió nada. Correr con --apply para aplicar.');
    return;
  }

  // 1) Respaldo de TODAS las filas
  const backupDir = resolve(root, '..', '_dt', 'backups');
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = resolve(backupDir, `catalog-${stamp}.json`);
  const backup = rows.map(({ id, is_active, gif_url, image_url }) => ({ id, is_active, gif_url, image_url }));
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`\nBackup: ${backupPath} (${backup.length} filas)`);

  // 2) is_active=false en no-calistenia (por lotes)
  const CHUNK = 100;
  for (let i = 0; i < excluded.length; i += CHUNK) {
    const ids = excluded.slice(i, i + CHUNK).map((r) => r.id);
    await patch(`id=in.(${ids.join(',')})`, { is_active: false });
    console.log(`  is_active=false: ${Math.min(i + CHUNK, excluded.length)}/${excluded.length}`);
  }

  // 3) gif_url=null en todas
  await patch('id=not.is.null', { gif_url: null });
  console.log('  gif_url=null: todas las filas');

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
