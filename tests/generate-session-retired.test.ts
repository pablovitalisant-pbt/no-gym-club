import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ planV2: true }));

vi.mock('@/lib/flags', () => ({
  getFlag: (key: string) => (key === 'training_plan_v2' ? h.planV2 : false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}));

vi.mock('@/lib/deepseek/client', () => ({
  streamChatCompletion: async function* () {},
  generateChatCompletion: async () => '{}',
}));

vi.mock('@/lib/nvidia/client', () => ({
  getEmbedding: async () => [0.1],
}));

import { POST } from '@/app/api/generate-session/route';

function request() {
  return new Request('http://localhost/api/generate-session', {
    method: 'POST',
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  h.planV2 = true;
});

describe('generate-session retirado con training_plan_v2 ON', () => {
  it('responde 410 con el error de retiro', async () => {
    const res = await POST(request());
    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toEqual({
      error: 'Daily generation retired: use the training plan',
    });
  });
});
