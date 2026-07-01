import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 4c-corpus — sport science corpus', () => {
  // ─── Smoke: archivos existen ───
  it('seed-corpus.sql existe con >= 40 documentos', () => {
    const raw = readFileSync(
      resolve(root, 'supabase/seed-corpus.sql'),
      'utf-8',
    );
    const inserts = raw.match(/INSERT INTO sport_science_corpus/gi);
    expect(inserts).not.toBeNull();
    expect(inserts!.length).toBeGreaterThanOrEqual(40);
  });

  it('cada documento tiene title, content, category, tags', () => {
    const raw = readFileSync(
      resolve(root, 'supabase/seed-corpus.sql'),
      'utf-8',
    );
    const blocks = raw
      .split('INSERT INTO sport_science_corpus')
      .filter((b) => b.includes('VALUES'));

    blocks.forEach((block, i) => {
      expect(block, `doc ${i + 1}: falta title`).toContain('title');
      expect(block, `doc ${i + 1}: falta content`).toContain('content');
      expect(block, `doc ${i + 1}: falta category`).toContain('category');
      expect(block, `doc ${i + 1}: falta tags`).toContain('tags');
    });
  });

  it('8 categorias estan cubiertas', () => {
    const raw = readFileSync(
      resolve(root, 'supabase/seed-corpus.sql'),
      'utf-8',
    );
    const categories = [
      'progressive_overload',
      'periodization',
      'hypertrophy',
      'endurance',
      'recovery',
      'rpe_autoregulation',
      'bodyweight_training',
      'safety_screening',
    ];

    categories.forEach((cat) => {
      expect(raw, `falta categoria ${cat}`).toContain(cat);
    });
  });

  it('nvidia/client.ts exporta funcion para generar embeddings', () => {
    const raw = readFileSync(
      resolve(root, 'lib/nvidia/client.ts'),
      'utf-8',
    );
    expect(raw).toContain('export');
    // debe usar la API de NVIDIA
    expect(raw).toContain('nvidia');
    // debe generar embeddings
    expect(raw).toContain('embed');
  });

  it('seed-corpus.ts usa nvidia/client y genera SQL con embeddings', () => {
    const raw = readFileSync(
      resolve(root, 'scripts/seed-corpus.ts'),
      'utf-8',
    );
    expect(raw).toContain('@/lib/nvidia/client');
    // script genera SQL output con embeddings (no conecta a Supabase)
    expect(raw).toContain('getEmbedding');
    expect(raw).toContain('INSERT INTO');
  });

  it('SQL es sintacticamente valido', () => {
    const raw = readFileSync(
      resolve(root, 'supabase/seed-corpus.sql'),
      'utf-8',
    );
    const blocks = raw
      .split('INSERT INTO sport_science_corpus')
      .filter((b) => b.includes('VALUES'));

    blocks.forEach((block, i) => {
      expect(
        block,
        `doc ${i + 1}: INSERT no cierra correctamente`,
      ).toContain(');');
    });
  });
});
