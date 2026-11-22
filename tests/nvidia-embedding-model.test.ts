import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve, join } from 'path';

const root = resolve(__dirname, '..');

function collectTs(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return collectTs(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('Bug #9 — modelo de embeddings NVIDIA', () => {
  beforeEach(() => {
    process.env.NVIDIA_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('el cliente envía nemotron 3.5 embed 1b con dimensions 1024', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2] }] }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    await getEmbedding('texto', 'query');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body,
    );
    expect(body.model).toBe('nvidia/nemotron-3.5-embed-1b');
    expect(body.dimensions).toBe(1024);
    expect(body.input_type).toBe('query');
  });

  it('no queda la cadena nv-embedqa-e5-v5 en lib, app ni scripts', () => {
    const files = [
      ...collectTs(resolve(root, 'lib')),
      ...collectTs(resolve(root, 'app')),
      ...collectTs(resolve(root, 'scripts')),
    ];
    const offenders = files.filter((f) =>
      readFileSync(f, 'utf-8').includes('nv-embedqa-e5-v5'),
    );
    expect(offenders).toEqual([]);
  });

  it('constantes del modelo exportadas', async () => {
    const mod = await import('@/lib/nvidia/client');
    expect(mod.EMBEDDING_MODEL).toBe('nvidia/nemotron-3.5-embed-1b');
    expect(mod.EMBEDDING_DIMENSIONS).toBe(1024);
  });
});
