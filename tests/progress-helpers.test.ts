import { describe, it, expect } from 'vitest';
import {
  computeConsistencyDelta,
  getWeeklyDayMarkers,
  countImprovedMarkers,
} from '@/lib/progress/report-helpers';

// ─── Mock helpers for type shape ───

type Row = {
  max_pushups: number | null;
  max_pullups: number | null;
  max_squats: number | null;
  max_dips: number | null;
  plank_seconds: number | null;
};

// ════════════════════════════════════════
// computeConsistencyDelta
// ════════════════════════════════════════

describe('computeConsistencyDelta', () => {
  it('returns null when prevWeekDays = 0 (division by zero guard)', () => {
    expect(computeConsistencyDelta(3, 0)).toBeNull();
    expect(computeConsistencyDelta(0, 0)).toBeNull();
    expect(computeConsistencyDelta(5, 0)).toBeNull();
    // No debe lanzar, no debe devolver NaN/Infinity/null
  });

  it('returns correct positive delta', () => {
    const result = computeConsistencyDelta(4, 3);
    expect(result).not.toBeNull();
    expect(result!.delta).toBeCloseTo(33.33, 0);
    expect(result!.direction).toBe('up');
    expect(result!.label).toContain('+');
  });

  it('returns correct negative delta', () => {
    const result = computeConsistencyDelta(2, 4);
    expect(result).not.toBeNull();
    expect(result!.delta).toBeCloseTo(-50, 0);
    expect(result!.direction).toBe('down');
    expect(result!.label).toContain('-');
  });

  it('returns flat delta when no change', () => {
    const result = computeConsistencyDelta(3, 3);
    expect(result).not.toBeNull();
    expect(result!.delta).toBe(0);
    expect(result!.direction).toBe('flat');
  });
});

// ════════════════════════════════════════
// getWeeklyDayMarkers
// ════════════════════════════════════════

describe('getWeeklyDayMarkers', () => {
  it('marks Wednesday as trained when session completed on Wednesday, shows future days', () => {
    const weekStart = new Date('2026-07-06T00:00:00Z'); // Monday
    const today = new Date('2026-07-08T12:00:00Z');    // Wednesday noon

    const sessions = [
      { completed_at: '2026-07-08T10:00:00Z' }, // Wednesday
      { completed_at: '2026-07-06T14:00:00Z' }, // Monday
    ];

    const markers = getWeeklyDayMarkers(sessions, weekStart, today);

    const mon = markers.find((m) => m.day === 'Mon')!;
    expect(mon.trained).toBe(true);
    expect(mon.isFuture).toBe(false);

    const wed = markers.find((m) => m.day === 'Wed')!;
    expect(wed.trained).toBe(true);
    expect(wed.isFuture).toBe(false);

    const tue = markers.find((m) => m.day === 'Tue')!;
    expect(tue.trained).toBe(false);
    expect(tue.isFuture).toBe(false);

    const fri = markers.find((m) => m.day === 'Fri')!;
    expect(fri.trained).toBe(false);
    expect(fri.isFuture).toBe(true);

    const sat = markers.find((m) => m.day === 'Sat')!;
    expect(sat.isFuture).toBe(true);

    const sun = markers.find((m) => m.day === 'Sun')!;
    expect(sun.isFuture).toBe(true);
  });

  it('shows all days as non-future for a completed past week', () => {
    const weekStart = new Date('2026-06-29T00:00:00Z'); // Mon of past week
    const today = new Date('2026-07-08T12:00:00Z');     // Well after that week

    const markers = getWeeklyDayMarkers([], weekStart, today);
    expect(markers.every((m) => !m.isFuture)).toBe(true);
    expect(markers.length).toBe(7);
  });

  it('returns all 7 days with correct labels', () => {
    const weekStart = new Date('2026-07-06T00:00:00Z');
    const today = new Date('2026-07-06T12:00:00Z');

    const markers = getWeeklyDayMarkers([], weekStart, today);
    expect(markers.map((m) => m.label)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(markers.map((m) => m.day)).toEqual([
      'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    ]);
  });
});

// ════════════════════════════════════════
// countImprovedMarkers
// ════════════════════════════════════════

describe('countImprovedMarkers', () => {
  it('counts improved/declined/unchanged correctly with mixed results', () => {
    const prev: Row = {
      max_pushups: 20, max_pullups: 5, max_squats: 30,
      max_dips: 10, plank_seconds: 60,
    };
    const curr: Row = {
      max_pushups: 25,  // improved (+5)
      max_pullups: 5,   // unchanged
      max_squats: 28,   // declined (-2)
      max_dips: 12,     // improved (+2)
      plank_seconds: 65, // improved (+5s)
    };

    const result = countImprovedMarkers(curr, prev);
    expect(result.improved).toBe(3);
    expect(result.declined).toBe(1);
    expect(result.unchanged).toBe(1);
    expect(result.total).toBe(5);
  });

  it('handles null fields as 0', () => {
    const prev: Row = {
      max_pushups: 20, max_pullups: null, max_squats: 30,
      max_dips: null, plank_seconds: 60,
    };
    const curr: Row = {
      max_pushups: null, max_pullups: 5, max_squats: 25,
      max_dips: 10, plank_seconds: 60,
    };

    const result = countImprovedMarkers(curr, prev);
    // pushups: 20→null = declined (treated as 20→0)
    // pullups: null→5 = improved (treated as 0→5)
    // squats: 30→25 = declined
    // dips: null→10 = improved (0→10)
    // plank: 60→60 = unchanged
    expect(result.improved).toBe(2);
    expect(result.declined).toBe(2);
    expect(result.unchanged).toBe(1);
    expect(result.total).toBe(5);
  });
});
