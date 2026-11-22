import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  plan: null as Record<string, unknown> | null,
  updates: [] as Record<string, unknown>[],
  filters: [] as [string, unknown][],
  updateFilters: [] as [string, unknown][],
}));

vi.mock('@/lib/supabase/server', () => {
  const selectChain = () => {
    const p: Record<string, unknown> = {
      select: () => p,
      eq: (k: string, v: unknown) => {
        h.filters.push([k, v]);
        return p;
      },
      maybeSingle: () => Promise.resolve({ data: h.plan, error: null }),
    };
    return p;
  };
  return {
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: h.user }, error: null }) },
      from: () => ({
        select: () => selectChain(),
        update: (patch: Record<string, unknown>) => {
          h.updates.push(patch);
          return {
            eq: (k: string, v: unknown) => {
              h.updateFilters.push([k, v]);
              return {
                eq: (k2: string, v2: unknown) => {
                  h.updateFilters.push([k2, v2]);
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        },
      }),
    }),
  };
});

import { completePlanDay, setCurrentPlanDay } from '@/app/[locale]/(app)/dashboard/plan-actions';

beforeEach(() => {
  h.user = { id: 'user-1' };
  h.plan = { current_day_index: 2, completed_day_indexes: [0, 1] };
  h.updates = [];
  h.filters = [];
  h.updateFilters = [];
});

describe('completePlanDay', () => {
  it('no permite tocar un plan ajeno: filtra por user_id y rechaza si no hay plan', async () => {
    h.plan = null;
    const res = await completePlanDay('plan-ajeno', 2);
    expect(res.success).toBe(false);
    expect(h.updates).toHaveLength(0);
    expect(h.filters).toContainEqual(['id', 'plan-ajeno']);
    expect(h.filters).toContainEqual(['user_id', 'user-1']);
  });

  it('completa: avanza el puntero y agrega el indice', async () => {
    const res = await completePlanDay('plan-1', 2);
    expect(res.success).toBe(true);
    expect(h.updates).toEqual([
      { current_day_index: 3, completed_day_indexes: [0, 1, 2] },
    ]);
    expect(h.updateFilters).toContainEqual(['user_id', 'user-1']);
  });

  it('no duplica un dia ya completado', async () => {
    const res = await completePlanDay('plan-1', 1);
    expect(res.success).toBe(true);
    expect(h.updates[0].completed_day_indexes).toEqual([0, 1]);
  });

  it('rechaza indices fuera de rango', async () => {
    const a = await completePlanDay('plan-1', -1);
    const b = await completePlanDay('plan-1', 84);
    expect(a.success).toBe(false);
    expect(b.success).toBe(false);
    expect(h.updates).toHaveLength(0);
  });

  it('rechaza sin usuario', async () => {
    h.user = null;
    const res = await completePlanDay('plan-1', 2);
    expect(res.success).toBe(false);
    expect(h.updates).toHaveLength(0);
  });
});

describe('setCurrentPlanDay', () => {
  it('acepta un indice en rango', async () => {
    const res = await setCurrentPlanDay('plan-1', 27);
    expect(res.success).toBe(true);
    expect(h.updates).toEqual([{ current_day_index: 27 }]);
    expect(h.updateFilters).toContainEqual(['user_id', 'user-1']);
  });

  it('rechaza fuera de rango', async () => {
    expect((await setCurrentPlanDay('plan-1', 84)).success).toBe(false);
    expect((await setCurrentPlanDay('plan-1', -1)).success).toBe(false);
    expect((await setCurrentPlanDay('plan-1', 1.5)).success).toBe(false);
    expect(h.updates).toHaveLength(0);
  });

  it('no permite un plan ajeno', async () => {
    h.plan = null;
    const res = await setCurrentPlanDay('plan-ajeno', 5);
    expect(res.success).toBe(false);
    expect(h.updates).toHaveLength(0);
  });
});
