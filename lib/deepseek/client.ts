import OpenAI from 'openai';

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

// Nombre vigente del modelo segun api-docs.deepseek.com/quick_start/pricing
// (consultado 2026-11-22). `deepseek-v4-flash` sigue aceptado y se enruta al mismo modelo.
export const DEEPSEEK_MODEL = 'deepseek-flash';

function createClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });
}

export async function generateChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<string> {
  const client = createClient();

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
  });

  const finishReason = response.choices[0]?.finish_reason;
  if (finishReason === 'length') {
    throw new Error(
      'DeepSeek output truncated: max_tokens reached before completion',
    );
  }

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned empty response');
  return content;
}

export async function* streamChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): AsyncGenerator<string, void, undefined> {
  const client = createClient();

  const stream = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;

    const finishReason = chunk.choices[0]?.finish_reason;
    if (finishReason === 'length') {
      throw new Error(
        'DeepSeek output truncated: max_tokens reached before completion',
      );
    }
  }
}
