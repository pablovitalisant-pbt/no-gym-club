// NVIDIA NIM embeddings client — endpoint OpenAI-compatible
// Modelo: nvidia/nv-embedqa-e5-v5, 1024 dimensiones

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_EMBED_MODEL = 'nvidia/nv-embedqa-e5-v5';

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_EMBED_MODEL,
      input: text,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(
      `NVIDIA API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.data[0].embedding;
}
