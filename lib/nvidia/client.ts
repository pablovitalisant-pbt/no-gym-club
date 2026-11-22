// NVIDIA NIM embeddings client — endpoint OpenAI-compatible
// Modelo: nvidia/nemotron-3.5-embed-1b, 1024 dimensiones (vector(1024) en DB)
// input_type: "passage" para documentos, "query" para búsquedas

export const EMBEDDING_MODEL = 'nvidia/nemotron-3.5-embed-1b';
export const EMBEDDING_DIMENSIONS = 1024;

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Bug #9b: 429 y 5xx son transitorios — 3 reintentos con backoff 1s/2s/4s
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getEmbedding(
  text: string,
  inputType: 'passage' | 'query' = 'passage',
): Promise<number[]> {
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: [text],
          input_type: inputType,
          dimensions: EMBEDDING_DIMENSIONS,
          encoding_format: 'float',
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      // Red caida o timeout: mismo backoff que 429/5xx.
      if (attempt >= RETRY_DELAYS_MS.length) throw err;
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }

    if (response.ok) {
      const data = await response.json();
      return data.data[0].embedding;
    }

    const retryable = response.status === 429 || response.status >= 500;
    const errBody = await response.text();
    if (!retryable || attempt >= RETRY_DELAYS_MS.length) {
      throw new Error(
        `NVIDIA API error: ${response.status} — ${errBody.slice(0, 200)}`,
      );
    }
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

/** Texto canónico de un ejercicio para embeddings (mismo usado por el catálogo). */
export function buildExerciseEmbeddingText(ex: {
  name_en: string;
  category: string;
  muscle_groups: string[] | null;
}): string {
  return `${ex.name_en} — ${ex.category} — works ${(ex.muscle_groups || []).join(', ')}`;
}
