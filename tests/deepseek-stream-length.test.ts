import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  chunks: [] as unknown[],
}));

vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: async () =>
          (async function* () {
            for (const chunk of h.chunks) yield chunk;
          })(),
      },
    };
  },
}));

import { streamChatCompletion } from '@/lib/deepseek/client';

beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = 'test-key';
  h.chunks = [];
});

describe('DeepSeek streaming — fin por longitud', () => {
  it('finish_reason length lanza el mismo error que el modo no-stream', async () => {
    h.chunks = [
      { choices: [{ delta: { content: '{"a":' }, finish_reason: null }] },
      { choices: [{ delta: {}, finish_reason: 'length' }] },
    ];
    const consume = async () => {
      for await (const _ of streamChatCompletion([{ role: 'user', content: 'x' }])) {
        // consume all chunks
      }
    };
    await expect(consume()).rejects.toThrow(
      'DeepSeek output truncated: max_tokens reached before completion',
    );
  });

  it('finish_reason stop no lanza', async () => {
    h.chunks = [
      { choices: [{ delta: { content: '{}' }, finish_reason: null }] },
      { choices: [{ delta: {}, finish_reason: 'stop' }] },
    ];
    const consume = async () => {
      let out = '';
      for await (const chunk of streamChatCompletion([{ role: 'user', content: 'x' }])) {
        out += chunk;
      }
      return out;
    };
    await expect(consume()).resolves.toBe('{}');
  });
});
