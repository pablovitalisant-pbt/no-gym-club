import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  plan: null as Record<string, unknown> | null,
  updates: [] as Record<string, unknown>[],
  filters: [] as [string, unknown][],
  updateFilters: [] as [string, unknown][],
  deletes: 0,
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
        delete: () => {
          h.deletes += 1;
          throw new Error('delete no permitido');
        },
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

import { abandonActivePlan } from '@/app/[locale]/(app)/dashboard/plan-actions';

beforeEach(() => {
  h.user = { id: 'user-1' };
  h.plan = { current_day_index: 2, completed_day_indexes: [0, 1] };
  h.updates = [];
  h.filters = [];
  h.updateFilters = [];
  h.deletes = 0;
});

describe('abandonActivePlan (Rehacer mi programa)', () => {
  it('desactiva el plan propio como abandonado, sin borrarlo', async () => {
    const res = await abandonActivePlan('plan-1');
    expect(res.success).toBe(true);
    expect(h.updates).toEqual([{ is_active: false, status: 'abandoned' }]);
    expect(h.updateFilters).toContainEqual(['id', 'plan-1']);
    expect(h.updateFilters).toContainEqual(['user_id', 'user-1']);
    expect(h.deletes).toBe(0);
  });

  it('no toca un plan ajeno o inexistente', async () => {
    h.plan = null;
    const res = await abandonActivePlan('plan-ajeno');
    expect(res.success).toBe(false);
    expect(h.updates).toHaveLength(0);
    expect(h.filters).toContainEqual(['id', 'plan-ajeno']);
    expect(h.filters).toContainEqual(['user_id', 'user-1']);
  });

  it('rechaza sin usuario', async () => {
    h.user = null;
    const res = await abandonActivePlan('plan-1');
    expect(res.success).toBe(false);
    expect(h.updates).toHaveLength(0);
  });
});
