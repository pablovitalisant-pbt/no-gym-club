import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const file = resolve(root, 'supabase/corpus-og.json');

const ALLOWED_CATEGORIES = new Set([
  'progressive_overload',
  'bodyweight_training',
  'recovery',
  'hypertrophy',
  'periodization',
  'rpe_autoregulation',
  'endurance',
  'safety_screening',
  'population',
  'program_design',
  'mesocycle',
]);

const TITLE_SUFFIX = / \(Low, Overcoming Gravity, ch\. \d+\)$/;

type Doc = {
  title: string;
  content: string;
  category: string;
  tags: string[];
};

function loadDocs(): Doc[] {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('Slice v2-04a — corpus Overcoming Gravity', () => {
  it('corpus-og.json es JSON valido', () => {
    expect(() => loadDocs()).not.toThrow();
  });

  it('contiene entre 30 y 40 documentos', () => {
    const docs = loadDocs();
    expect(docs.length).toBeGreaterThanOrEqual(30);
    expect(docs.length).toBeLessThanOrEqual(40);
  });

  it('cada documento tiene title, content, category y tags validos', () => {
    loadDocs().forEach((doc, i) => {
      expect(typeof doc.title, `doc ${i + 1}: title`).toBe('string');
      expect(doc.title.length, `doc ${i + 1}: title vacio`).toBeGreaterThan(0);
      expect(typeof doc.content, `doc ${i + 1}: content`).toBe('string');
      expect(typeof doc.category, `doc ${i + 1}: category`).toBe('string');
      expect(Array.isArray(doc.tags), `doc ${i + 1}: tags`).toBe(true);
      expect(doc.tags.length, `doc ${i + 1}: tags vacio`).toBeGreaterThan(0);
      doc.tags.forEach((tag, j) => {
        expect(typeof tag, `doc ${i + 1}: tag ${j}`).toBe('string');
      });
    });
  });

  it('todas las categorias estan en la lista permitida', () => {
    loadDocs().forEach((doc, i) => {
      expect(
        ALLOWED_CATEGORIES.has(doc.category),
        `doc ${i + 1} (${doc.title}): categoria "${doc.category}"`,
      ).toBe(true);
    });
  });

  it('todos los titulos llevan el sufijo de atribucion', () => {
    loadDocs().forEach((doc, i) => {
      expect(doc.title, `doc ${i + 1}`).toMatch(TITLE_SUFFIX);
    });
  });

  it('cada content tiene entre 80 y 200 palabras', () => {
    loadDocs().forEach((doc, i) => {
      const count = wordCount(doc.content);
      expect(
        count,
        `doc ${i + 1} (${doc.title}): ${count} palabras`,
      ).toBeGreaterThanOrEqual(80);
      expect(
        count,
        `doc ${i + 1} (${doc.title}): ${count} palabras`,
      ).toBeLessThanOrEqual(200);
    });
  });
});
