import OpenAI from 'openai';

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

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

export async function* streamChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): AsyncGenerator<string, void, undefined> {
  const client = createClient();

  const stream = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
