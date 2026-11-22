import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function res(status: number, embedding: number[] = [0.1, 0.2]) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ data: [{ embedding }] }),
    text: async () => `status ${status}`,
  };
}

describe('Bug #9b — reintentos en embeddings NVIDIA', () => {
  beforeEach(() => {
    process.env.NVIDIA_API_KEY = 'test-key';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('502,502,200 → ok con 3 llamadas y backoff 1s+2s', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(502))
      .mockResolvedValueOnce(res(502))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    const p = getEmbedding('texto');
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(await p).toEqual([0.1, 0.2]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('400 → falla sin reintento', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(400));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    await expect(getEmbedding('texto')).rejects.toThrow('NVIDIA API error: 400');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('error de red → reintenta con el mismo backoff y termina ok', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    const p = getEmbedding('texto');
    await vi.advanceTimersByTimeAsync(1000);
    expect(await p).toEqual([0.1, 0.2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('error de red persistente → falla tras 3 reintentos', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('timeout'));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    const p = getEmbedding('texto');
    const assertion = expect(p).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('pasa un AbortSignal con timeout de 20s al fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    await getEmbedding('texto');
    const init = fetchMock.mock.calls[0][1] as { signal?: unknown };
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('502×4 → falla tras 3 reintentos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(502));
    vi.stubGlobal('fetch', fetchMock);

    const { getEmbedding } = await import('@/lib/nvidia/client');
    const p = getEmbedding('texto');
    const assertion = expect(p).rejects.toThrow('NVIDIA API error: 502');
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
