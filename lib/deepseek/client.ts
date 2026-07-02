import OpenAI from 'openai';

// ponytail: thin wrapper — el SDK openai ya maneja retries, streaming, etc.
// Add streaming support when Slice 8 (motor de sesión) lo necesite.

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

export async function generateChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });

  const response = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned empty response');
  return content;
}
