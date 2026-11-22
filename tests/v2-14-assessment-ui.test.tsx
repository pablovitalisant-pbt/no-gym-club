import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const DICT: Record<string, string> = {
  'assessment.stepOf': 'Paso {current} de {total}',
  'assessment.profile.days': 'Elige cuántos días a la semana puedes entrenar',
  'assessment.profile.title': 'Tu perfil',
  'assessment.profile.focusTitle': '¿Tienes alguna meta particular?',
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, vals?: Record<string, unknown>) =>
    (DICT[`${ns}.${key}`] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vals?.[k] ?? '')),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/app/[locale]/(app)/assessment/actions', () => ({
  saveProfile: vi.fn(),
}));

import { AssessmentForm } from '../app/[locale]/(app)/assessment/assessment-form';
import { ProfileStep } from '../components/assessment/ProfileStep';
import { Button } from '../components/ui/Button';

const noop = () => {};

function profileMarkup() {
  return renderToStaticMarkup(
    <ProfileStep
      age="" setAge={noop} weight="" setWeight={noop} height="" setHeight={noop}
      experience="beginner" setExperience={noop} goal="general_fitness" setGoal={noop}
      days="3" setDays={noop} trainingHistory={null} setTrainingHistory={noop}
      focusAreas={[]} setFocusAreas={noop} focusNotes="" setFocusNotes={noop}
      onNext={noop}
    />,
  );
}

describe('Slice v2-14 — indicador, días y botones', () => {
  it('el indicador muestra "Paso 1 de 5" y no los 5 títulos apilados', () => {
    const html = renderToStaticMarkup(<AssessmentForm />);
    expect(html).toContain('Paso 1 de 5');
    expect(html).toContain('Tu perfil');
    expect(html.match(/1\. /g)).toBeNull();
  });

  it('días: 7 botones con aria-pressed y el texto de la pregunta', () => {
    const html = profileMarkup();
    expect(html).toContain('Elige cuántos días a la semana puedes entrenar');
    // 7 botones-grandes de días (los pills de focus no llevan min-w-12)
    expect((html.match(/min-w-12/g) ?? []).length).toBe(7);
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('type="range"');
  });

  it('Button primario: fondo acento, texto oscuro y alto mínimo 56 px', () => {
    const html = renderToStaticMarkup(<Button>Hola</Button>);
    expect(html).toContain('bg-accent');
    expect(html).toContain('text-surface-900');
    expect(html).toContain('min-h-[56px]');
  });

  it('Button secundario: borde visible', () => {
    const html = renderToStaticMarkup(<Button variant="secondary">Atrás</Button>);
    expect(html).toContain('border-2');
  });
});
