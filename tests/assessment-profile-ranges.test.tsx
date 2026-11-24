import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { inProfileRange, profileRangeError } from '@/lib/assessment/validate';
import { ProfileStep } from '@/components/assessment/ProfileStep';
import { HealthStep } from '@/components/assessment/HealthStep';

const root = resolve(__dirname, '..');
const es = JSON.parse(readFileSync(resolve(root, 'messages/es.json'), 'utf-8'));

function renderProfile(overrides: Partial<React.ComponentProps<typeof ProfileStep>> = {}) {
  const props: React.ComponentProps<typeof ProfileStep> = {
    age: '30',
    setAge: () => {},
    weight: '75',
    setWeight: () => {},
    height: '180',
    setHeight: () => {},
    experience: 'beginner',
    setExperience: () => {},
    goal: 'general_fitness',
    setGoal: () => {},
    days: '3',
    setDays: () => {},
    trainingHistory: 'active',
    setTrainingHistory: () => {},
    focusAreas: [],
    setFocusAreas: () => {},
    focusNotes: '',
    setFocusNotes: () => {},
    onNext: () => {},
    ...overrides,
  };
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="es" messages={es} timeZone="UTC">
      <ProfileStep {...props} />
    </NextIntlClientProvider>,
  );
}

function nextButton(html: string): string {
  const i = html.indexOf('Siguiente');
  if (i < 0) throw new Error('no se encontro el boton Siguiente');
  return html.slice(html.lastIndexOf('<button', i), html.indexOf('</button>', i));
}

// v2-26: el className base incluye variantes `disabled:`; el atributo es lo que importa.
function nextButtonIsDisabled(html: string): boolean {
  const tag = nextButton(html).split('>')[0];
  return /\sdisabled(=|\s|$)/.test(tag);
}

describe('rangos del perfil (P-20261122-0006-1)', () => {
  it('inProfileRange aplica edad 14-100', () => {
    expect(inProfileRange('age', '13')).toBe(false);
    expect(inProfileRange('age', '14')).toBe(true);
    expect(inProfileRange('age', '100')).toBe(true);
    expect(inProfileRange('age', '101')).toBe(false);
  });

  it('inProfileRange aplica peso 30-250 y altura 100-250', () => {
    expect(inProfileRange('weight_kg', '29.9')).toBe(false);
    expect(inProfileRange('weight_kg', '30')).toBe(true);
    expect(inProfileRange('weight_kg', '250')).toBe(true);
    expect(inProfileRange('weight_kg', '250.1')).toBe(false);
    expect(inProfileRange('height_cm', '99')).toBe(false);
    expect(inProfileRange('height_cm', '250.1')).toBe(false);
    expect(inProfileRange('height_cm', '180')).toBe(true);
  });

  it('inProfileRange rechaza vacio o no numerico', () => {
    expect(inProfileRange('age', '')).toBe(false);
    expect(inProfileRange('age', 'abc')).toBe(false);
  });

  it('profileRangeError devuelve el primer campo fuera de rango', () => {
    expect(profileRangeError({ age: 30, weight_kg: 75, height_cm: 180 })).toBeNull();
    expect(profileRangeError({ age: 30, weight_kg: 1000, height_cm: 180 })).toBe('weight_kg');
    expect(profileRangeError({ age: 5, weight_kg: 1000, height_cm: 180 })).toBe('age');
  });

  it('el server action valida rangos antes de guardar', () => {
    const src = readFileSync(resolve(root, 'app/[locale]/(app)/assessment/actions.ts'), 'utf-8');
    expect(src).toContain('profileRangeError');
  });
});

describe('paso de perfil — peso 1000 (EXP-1)', () => {
  it('muestra el error de rango bajo el peso y deshabilita Siguiente', () => {
    const html = renderProfile({ weight: '1000' });
    expect(html).toContain('Valor entre 30 y 250');
    expect(nextButtonIsDisabled(html)).toBe(true);
  });

  it('con datos validos no muestra error y habilita Siguiente', () => {
    const html = renderProfile();
    expect(html).not.toContain('Valor entre');
    expect(nextButtonIsDisabled(html)).toBe(false);
  });

  it('muestra contador en focus_notes', () => {
    const html = renderProfile({ focusNotes: 'hola' });
    expect(html).toContain('4/300');
  });
});

describe('contador en limitations_notes', () => {
  it('muestra contador y respeta maxLength', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="es" messages={es} timeZone="UTC">
        <HealthStep
          limitations={[]}
          onToggle={() => {}}
          notes="abc"
          onNotesChange={() => {}}
          onBack={() => {}}
          onNext={() => {}}
        />
      </NextIntlClientProvider>,
    );
    expect(html).toContain('maxLength="300"');
    expect(html).toContain('3/300');
  });
});
