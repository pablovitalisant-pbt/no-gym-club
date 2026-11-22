import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlanData } from '../lib/types/plan';
import type { SessionData } from '../lib/types/session';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  plan: null as Record<string, unknown> | null,
  openSession: null as Record<string, unknown> | null,
  inserted: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/supabase/server', () => {
  const chain = (get: () => unknown) => {
    const p: Record<string, unknown> = {};
    p.select = () => p;
    p.eq = () => p;
    p.is = () => p;
    p.maybeSingle = () => Promise.resolve({ data: get(), error: null });
    p.single = () => Promise.resolve({ data: get(), error: null });
    return p;
  };
  return {
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: h.user }, error: null }) },
      from: (table: string) => ({
        select: () =>
          chain(() => (table === 'training_plans' ? h.plan : h.openSession)),
        insert: (row: Record<string, unknown>) => {
          h.inserted.push(row);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'ws-new' }, error: null }),
            }),
          };
        },
      }),
    }),
  };
});

import { startPlanSession } from '@/app/[locale]/(app)/dashboard/plan-actions';

const session: SessionData = {
  title_es: 'Día push',
  title_en: 'Push day',
  warmup: [{ exercise: 'movilidad', duration_seconds: 300 }],
  main: [{ exercise: 'flexiones', sets: 3, reps: '8', rest_seconds: 60 }],
  cooldown: [],
  rationale_es: '',
  rationale_en: '',
  science_refs: [],
};

function makePlan(withSession = true): PlanData {
  return {
    version: 2,
    total_weeks: 12,
    phase_weeks: 4,
    phases: [
      {
        index: 0,
        name_es: 'fase 0',
        name_en: 'phase 0',
        week_template: Array.from({ length: 7 }, (_, d) => ({
          type: d === 6 ? ('rest' as const) : ('push' as const),
          label_es: `d${d}`,
          label_en: `d${d}`,
          session: d === 6 || !withSession ? null : session,
        })),
        rationale_es: '',
        rationale_en: '',
        science_refs: [],
        generated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

beforeEach(() => {
  h.user = { id: 'user-1' };
  h.plan = { plan_data: makePlan() };
  h.openSession = null;
  h.inserted = [];
});

describe('startPlanSession', () => {
  it('rechaza un plan ajeno (no encontrado por user_id)', async () => {
    h.plan = null;
    const res = await startPlanSession('plan-ajeno', 0);
    expect(res.success).toBe(false);
    expect(h.inserted).toHaveLength(0);
  });

  it('rechaza sin usuario', async () => {
    h.user = null;
    const res = await startPlanSession('plan-1', 0);
    expect(res.success).toBe(false);
    expect(h.inserted).toHaveLength(0);
  });

  it('rechaza un día sin sesión (descanso)', async () => {
    const res = await startPlanSession('plan-1', 6);
    expect(res.success).toBe(false);
    expect(h.inserted).toHaveLength(0);
  });

  it('rechaza un día de una fase no generada', async () => {
    const res = await startPlanSession('plan-1', 28);
    expect(res.success).toBe(false);
    expect(h.inserted).toHaveLength(0);
  });

  it('reutiliza una sesión abierta del mismo plan y día', async () => {
    h.openSession = { id: 'ws-open' };
    const res = await startPlanSession('plan-1', 0);
    expect(res).toEqual({ success: true, sessionId: 'ws-open' });
    expect(h.inserted).toHaveLength(0);
  });

  it('crea una sesión nueva con plan_id, plan_day_index y scheduled_date', async () => {
    const res = await startPlanSession('plan-1', 2);
    expect(res).toEqual({ success: true, sessionId: 'ws-new' });
    expect(h.inserted).toHaveLength(1);
    const row = h.inserted[0];
    expect(row.plan_id).toBe('plan-1');
    expect(row.plan_day_index).toBe(2);
    expect(row.session_data).toEqual(session);
    expect(row.scheduled_date).toBe(new Date().toISOString().slice(0, 10));
  });
});
