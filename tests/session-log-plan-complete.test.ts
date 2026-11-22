import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  row: null as Record<string, unknown> | null,
  updates: [] as Record<string, unknown>[],
  completeCalls: [] as unknown[][],
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: h.user }, error: null }) },
    from: () => ({
      select: () => {
        const p: Record<string, unknown> = {};
        p.eq = () => p;
        p.maybeSingle = () => Promise.resolve({ data: h.row, error: null });
        return p;
      },
      update: (patch: Record<string, unknown>) => {
        h.updates.push(patch);
        return {
          eq: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      },
    }),
  }),
}));

vi.mock('@/app/[locale]/(app)/dashboard/plan-actions', () => ({
  completePlanDay: async (...args: unknown[]) => {
    h.completeCalls.push(args);
    return { success: true };
  },
}));

import { saveSessionLog } from '@/components/session/actions';

beforeEach(() => {
  h.user = { id: 'user-1' };
  h.row = null;
  h.updates = [];
  h.completeCalls = [];
});

describe('saveSessionLog — completar día del plan', () => {
  it('con plan_id completa el día del plan', async () => {
    h.row = { plan_id: 'plan-1', plan_day_index: 2 };
    const res = await saveSessionLog('ws-1', 7);
    expect(res.success).toBe(true);
    expect(h.completeCalls).toEqual([['plan-1', 2]]);
    expect(h.updates[0].rpe).toBe(7);
  });

  it('sin plan_id (sesión v1) no toca el plan', async () => {
    h.row = { plan_id: null, plan_day_index: null };
    const res = await saveSessionLog('ws-1', 7);
    expect(res.success).toBe(true);
    expect(h.completeCalls).toHaveLength(0);
  });

  it('con plan_id pero sin plan_day_index no completa', async () => {
    h.row = { plan_id: 'plan-1', plan_day_index: null };
    const res = await saveSessionLog('ws-1', 7);
    expect(res.success).toBe(true);
    expect(h.completeCalls).toHaveLength(0);
  });

  it('rechaza RPE fuera de rango sin completar el día', async () => {
    h.row = { plan_id: 'plan-1', plan_day_index: 2 };
    const res = await saveSessionLog('ws-1', 11);
    expect(res.success).toBe(false);
    expect(h.completeCalls).toHaveLength(0);
  });
});
