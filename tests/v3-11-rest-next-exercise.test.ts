import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import es from '../messages/es.json';
import en from '../messages/en.json';
import { segmentView } from '@/lib/session/continuous-view';
import { gaugeGeometry } from '@/components/session/NotchGauge';
import type { Segment } from '@/lib/session/continuous';

const root = resolve(__dirname, '..');
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('v3-11 — descanso y selector', () => {
  it('expone el gif del siguiente ejercicio y null al final o sin gif', () => {
    const timeline: Segment[] = [
      { kind: 'rest', seconds: 30, exerciseIndex: 0, set: 1 },
      { kind: 'work', seconds: 20, exerciseIndex: 1, set: 1 },
    ];
    const exercises = [
      { exercise: 'A', sets: 1, reps: '8', gif_url: null },
      { exercise: 'B', sets: 1, reps: '8', gif_url: 'https://example.test/b.gif' },
    ];
    expect(segmentView(timeline, exercises, 0)?.nextGifUrl).toBe('https://example.test/b.gif');
    expect(segmentView(timeline, [{ ...exercises[0], gif_url: null }, exercises[1]], 0)?.nextGifUrl).toBe('https://example.test/b.gif');
    expect(segmentView(timeline, exercises, 1)?.nextGifUrl).toBeNull();
  });

  it('monta el gif solo al expandir y usa aria-expanded', () => {
    const rest = read('components/session/player/RestScreen.tsx');
    expect(rest).toContain('nextGifUrl');
    expect(rest).toContain('aria-expanded');
    expect(rest).toContain("t('showNextExercise')");
    expect(rest).toContain("t('hideNextExercise')");
    expect(rest).toContain("loading=\"lazy\"");
  });

  it('maneja el fallo del gif con estado React, no con manipulacion DOM', () => {
    const rest = read('components/session/player/RestScreen.tsx');
    expect(rest).not.toContain('replaceWith');
    expect(rest).not.toContain('document.createTextNode');
    expect(rest).toContain('const [gifFailed, setGifFailed] = useState(false)');
    expect(rest).toContain('setGifFailed(true)');
    expect(rest).toContain("t('noImage')");
  });

  it('elimina el cronómetro duplicado y usa radios accesibles', () => {
    const player = read('components/session/ContinuousPlayer.tsx');
    const toggle = read('components/session/player/ModeToggle.tsx');
    expect(player).not.toContain('{p.remaining}s');
    expect(toggle).toContain('role="radiogroup"');
    expect(toggle).toContain('role="radio"');
    expect(toggle).toContain('aria-checked');
    expect(toggle).not.toContain('aria-pressed');
  });

  it('mantiene las claves i18n simétricas', () => {
    for (const key of ['showNextExercise', 'hideNextExercise', 'nextExerciseGifAlt', 'modeLabel']) {
      expect(es.session).toHaveProperty(key);
      expect(en.session).toHaveProperty(key);
    }
  });

  it('la geometría deja espacio para el número central', () => {
    const geometry = gaugeGeometry(320, 128);
    expect(geometry.height).toBeGreaterThanOrEqual(geometry.numberTop + 128 * 0.9);
  });
});
