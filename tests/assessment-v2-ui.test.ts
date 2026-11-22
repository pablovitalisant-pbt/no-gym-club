import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const formPath = resolve(root, 'app/[locale]/(app)/assessment/assessment-form.tsx');

function read(p: string) {
  return readFileSync(p, 'utf-8');
}

describe('Slice v2-03b — assessment UI health/cardio', () => {
  it('el form declara los 5 pasos en orden: profile, equipment, health, cardio, parq', () => {
    const src = read(formPath);
    expect(src).toMatch(
      /\[\s*'profile'\s*,\s*'equipment'\s*,\s*'health'\s*,\s*'cardio'\s*,\s*'parq'\s*\]/,
    );
  });

  it('el form no ofrece dumbbell como equipamiento', () => {
    expect(read(formPath)).not.toContain('dumbbell');
    const eqPath = resolve(root, 'components/assessment/EquipmentStep.tsx');
    if (existsSync(eqPath)) expect(read(eqPath)).not.toContain('dumbbell');
  });

  it('saveProfile se llama con training_history, health_limitations y cardio_preference', () => {
    const src = read(formPath);
    expect(src).toContain('training_history');
    expect(src).toContain('health_limitations');
    expect(src).toContain('cardio_preference');
    expect(src).toContain('limitations_notes');
  });

  it('health step limita las notas a 300 caracteres', () => {
    const healthPath = resolve(root, 'components/assessment/HealthStep.tsx');
    expect(existsSync(healthPath)).toBe(true);
    expect(read(healthPath)).toContain('maxLength={300}');
  });

  it('keys i18n nuevas simetricas ES/EN y no vacias', () => {
    const es = JSON.parse(read(resolve(root, 'messages/es.json')));
    const en = JSON.parse(read(resolve(root, 'messages/en.json')));

    const keys = [
      'profile.history',
      'profile.never',
      'profile.past',
      'profile.active',
      'health.title',
      'health.hint',
      'health.knees',
      'health.lower_back',
      'health.shoulders',
      'health.wrists',
      'health.hips',
      'health.other',
      'health.notes',
      'health.none',
      'cardio.title',
      'cardio.hint',
      'cardio.none',
      'cardio.noneDesc',
      'cardio.light',
      'cardio.lightDesc',
      'cardio.moderate',
      'cardio.moderateDesc',
      'cardio.intense',
      'cardio.intenseDesc',
    ];

    const get = (obj: Record<string, unknown>, key: string) =>
      key.split('.').reduce<unknown>(
        (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
        obj.assessment,
      );

    for (const key of keys) {
      expect(get(es, key), `falta assessment.${key} en es.json`).toBeTruthy();
      expect(get(en, key), `falta assessment.${key} en en.json`).toBeTruthy();
    }
  });

  it('subtrees assessment ES/EN tienen exactamente las mismas keys', () => {
    const es = JSON.parse(read(resolve(root, 'messages/es.json')));
    const en = JSON.parse(read(resolve(root, 'messages/en.json')));

    const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null
          ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      );

    expect(flatten(es.assessment).sort()).toEqual(flatten(en.assessment).sort());
  });
});
