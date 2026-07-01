// NVIDIA NIM embeddings client — endpoint OpenAI-compatible
// Modelo: nvidia/nv-embedqa-e5-v5, 1024 dimensiones
// input_type: "passage" para documentos, "query" para búsquedas

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_EMBED_MODEL = 'nvidia/nv-embedqa-e5-v5';

export async function getEmbedding(
  text: string,
  inputType: 'passage' | 'query' = 'passage',
): Promise<number[]> {
  const response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_EMBED_MODEL,
      input: [text],
      input_type: inputType,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `NVIDIA API error: ${response.status} — ${errBody.slice(0, 200)}`,
    );
  }

  const data = await response.json();
  return data.data[0].embedding;
}
